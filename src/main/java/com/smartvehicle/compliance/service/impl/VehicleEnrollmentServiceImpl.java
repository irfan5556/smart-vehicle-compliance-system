package com.smartvehicle.compliance.service.impl;

import com.smartvehicle.compliance.dto.request.VehicleLookupEnrollRequest;
import com.smartvehicle.compliance.dto.response.ComplianceRecordResponse;
import com.smartvehicle.compliance.dto.response.RtoVehicleApiResponse;
import com.smartvehicle.compliance.dto.response.VehicleResponse;
import com.smartvehicle.compliance.entity.ComplianceRecord;
import com.smartvehicle.compliance.entity.User;
import com.smartvehicle.compliance.entity.Vehicle;
import com.smartvehicle.compliance.enums.ComplianceType;
import com.smartvehicle.compliance.exception.ResourceNotFoundException;
import com.smartvehicle.compliance.repository.ComplianceRecordRepository;
import com.smartvehicle.compliance.repository.UserRepository;
import com.smartvehicle.compliance.repository.VehicleRepository;
import com.smartvehicle.compliance.service.RtoIntegrationService;
import com.smartvehicle.compliance.service.VehicleEnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleEnrollmentServiceImpl implements VehicleEnrollmentService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ComplianceRecordRepository complianceRecordRepository;
    private final RtoIntegrationService rtoIntegrationService;

    @Override
    @Transactional
    public VehicleResponse lookupAndEnrollVehicle(VehicleLookupEnrollRequest request) {
        Long targetUserId = request.getUserId() != null ? request.getUserId() : 1L;
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        return enrollVehicleWithRequest(request, user);
    }

    @Override
    @Transactional
    public VehicleResponse lookupAndEnrollVehicleForUser(String plate, String userEmail) {
        VehicleLookupEnrollRequest request = VehicleLookupEnrollRequest.builder()
                .registrationNumber(plate)
                .build();
        return lookupAndEnrollVehicleForUser(request, userEmail);
    }

    @Override
    @Transactional
    public VehicleResponse lookupAndEnrollVehicleForUser(VehicleLookupEnrollRequest request, String userEmail) {
        String cleanPlate = request.getRegistrationNumber().trim().toUpperCase().replaceAll("\\s+", "");
        log.info("Processing enrollment for vehicle plate: {} under user email: {}", cleanPlate, userEmail);

        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(userEmail, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email/username: " + userEmail));

        return enrollVehicleWithRequest(request, user);
    }

    private VehicleResponse enrollVehicleWithRequest(VehicleLookupEnrollRequest request, User user) {
        String cleanPlate = request.getRegistrationNumber().trim().toUpperCase().replaceAll("\\s+", "");

        // Find existing vehicle or create new
        Vehicle vehicle = vehicleRepository.findByRegistrationNumberIgnoreCase(cleanPlate)
                .orElseGet(() -> Vehicle.builder()
                        .registrationNumber(cleanPlate)
                        .user(user)
                        .build());

        vehicle.setUser(user);

        // Case A: Manual direct entry provided by user
        if (request.getMakeAndModel() != null && !request.getMakeAndModel().isBlank()) {
            log.info("Enrolling vehicle via direct manual specification for plate: {}", cleanPlate);
            vehicle.setMakeAndModel(request.getMakeAndModel().trim());
            vehicle.setVehicleType(request.getVehicleType() != null && !request.getVehicleType().isBlank()
                    ? request.getVehicleType().trim()
                    : "Motor Car (LMV)");

            LocalDate today = LocalDate.now();

            // Insurance
            LocalDate insExpiry = request.getInsuranceExpiryDate() != null ? request.getInsuranceExpiryDate() : today.plusDays(365);
            upsertComplianceRecord(
                    vehicle,
                    ComplianceType.INSURANCE,
                    request.getInsurancePolicyNumber() != null && !request.getInsurancePolicyNumber().isBlank()
                            ? request.getInsurancePolicyNumber()
                            : "POL-" + Math.abs(cleanPlate.hashCode() % 900000 + 100000),
                    request.getInsuranceProvider() != null && !request.getInsuranceProvider().isBlank()
                            ? request.getInsuranceProvider()
                            : "Direct Insurance Provider",
                    insExpiry
            );

            // PUC
            LocalDate pucExpiry = request.getPucExpiryDate() != null ? request.getPucExpiryDate() : today.plusDays(180);
            upsertComplianceRecord(
                    vehicle,
                    ComplianceType.PUC,
                    request.getPucCertificateNumber() != null && !request.getPucCertificateNumber().isBlank()
                            ? request.getPucCertificateNumber()
                            : "PUC-" + Math.abs((cleanPlate.hashCode() / 7) % 90000 + 10000),
                    request.getPucProvider() != null && !request.getPucProvider().isBlank()
                            ? request.getPucProvider()
                            : "Authorized Emission Testing Lab",
                    pucExpiry
            );

            // Road Tax (optional)
            if (request.getRoadTaxExpiryDate() != null) {
                upsertComplianceRecord(
                        vehicle,
                        ComplianceType.ROAD_TAX,
                        request.getRoadTaxCertificateNumber() != null && !request.getRoadTaxCertificateNumber().isBlank()
                                ? request.getRoadTaxCertificateNumber()
                                : "TAX-" + cleanPlate,
                        "State Transport Department",
                        request.getRoadTaxExpiryDate()
                );
            }
        } else {
            // Case B: Auto-lookup via Parivahan RTO (Sandbox Simulator or Live fallback)
            RtoVehicleApiResponse rtoData;
            if (Boolean.TRUE.equals(request.getUseSandbox())) {
                log.info("Directly querying Parivahan Sandbox Simulator for plate: {}", cleanPlate);
                rtoData = rtoIntegrationService.generateSandboxVehicleDetails(cleanPlate);
            } else {
                rtoData = rtoIntegrationService.fetchVehicleDetails(cleanPlate);
            }

            String makerModel = Optional.ofNullable(rtoData.resolveMakerModel())
                    .filter(s -> !s.isBlank())
                    .orElse("Standard Vehicle");

            String vehicleType = Optional.ofNullable(rtoData.resolveVehicleClass())
                    .filter(s -> !s.isBlank())
                    .orElse("Motor Car (LMV)");

            vehicle.setMakeAndModel(makerModel);
            vehicle.setVehicleType(vehicleType);

            // Parse compliance validity dates
            Optional<LocalDate> insuranceExpiry = rtoIntegrationService.parseRtoDate(rtoData.resolveInsuranceUpto());
            Optional<LocalDate> pucExpiry = rtoIntegrationService.parseRtoDate(rtoData.resolvePuccUpto());
            Optional<LocalDate> roadTaxExpiry = rtoIntegrationService.parseRtoDate(rtoData.resolveRoadTaxUpto());

            // Upsert INSURANCE compliance record
            insuranceExpiry.ifPresent(expiryDate -> upsertComplianceRecord(
                    vehicle,
                    ComplianceType.INSURANCE,
                    rtoData.resolveInsurancePolicyNumber(),
                    rtoData.resolveInsuranceCompany(),
                    expiryDate
            ));

            // Upsert PUC compliance record
            pucExpiry.ifPresent(expiryDate -> upsertComplianceRecord(
                    vehicle,
                    ComplianceType.PUC,
                    rtoData.resolvePuccNumber(),
                    "Authorized PUC Emission Center",
                    expiryDate
            ));

            // Upsert ROAD_TAX compliance record if present
            roadTaxExpiry.ifPresent(expiryDate -> upsertComplianceRecord(
                    vehicle,
                    ComplianceType.ROAD_TAX,
                    "TAX-" + cleanPlate,
                    "State Transport Department",
                    expiryDate
            ));
        }

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        log.info("Successfully enrolled vehicle {} with {} compliance records",
                savedVehicle.getRegistrationNumber(), savedVehicle.getComplianceRecords().size());

        return mapToVehicleResponse(savedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleByRegistrationNumber(String registrationNumber) {
        String cleanPlate = registrationNumber.trim().toUpperCase().replaceAll("\\s+", "");
        Vehicle vehicle = vehicleRepository.findByRegistrationNumberIgnoreCase(cleanPlate)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with registration: " + cleanPlate));
        return mapToVehicleResponse(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }
        return vehicleRepository.findByUserId(userId)
                .stream()
                .map(this::mapToVehicleResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByUserEmail(String email) {
        return vehicleRepository.findByUserEmailIgnoreCaseOrUserUsernameIgnoreCase(email, email)
                .stream()
                .map(this::mapToVehicleResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getAllVehiclesForAdmin() {
        return vehicleRepository.findAll()
                .stream()
                .map(this::mapToVehicleResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteVehicle(Long vehicleId) {
        log.info("Admin deleting vehicle record with ID: {}", vehicleId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
        vehicleRepository.delete(vehicle);
        log.info("Vehicle {} deleted successfully", vehicleId);
    }

    private void upsertComplianceRecord(Vehicle vehicle, ComplianceType type, String certNumber, String provider, LocalDate expiryDate) {
        Optional<ComplianceRecord> existingRecordOpt = vehicle.getComplianceRecords().stream()
                .filter(rec -> rec.getComplianceType() == type)
                .findFirst();

        if (existingRecordOpt.isPresent()) {
            ComplianceRecord record = existingRecordOpt.get();
            record.setExpiryDate(expiryDate);
            if (certNumber != null && !certNumber.isBlank()) {
                record.setCertificateNumber(certNumber);
            }
            if (provider != null && !provider.isBlank()) {
                record.setProvider(provider);
            }
        } else {
            ComplianceRecord newRecord = ComplianceRecord.builder()
                    .complianceType(type)
                    .certificateNumber(certNumber != null ? certNumber : "N/A")
                    .provider(provider != null ? provider : "Authorized Authority")
                    .expiryDate(expiryDate)
                    .build();
            vehicle.addComplianceRecord(newRecord);
        }
    }

    private VehicleResponse mapToVehicleResponse(Vehicle vehicle) {
        LocalDate today = LocalDate.now();

        List<ComplianceRecordResponse> recordResponses = new ArrayList<>();
        if (vehicle.getComplianceRecords() != null) {
            for (ComplianceRecord rec : vehicle.getComplianceRecords()) {
                long daysUntil = ChronoUnit.DAYS.between(today, rec.getExpiryDate());
                recordResponses.add(ComplianceRecordResponse.builder()
                        .id(rec.getId())
                        .complianceType(rec.getComplianceType())
                        .certificateNumber(rec.getCertificateNumber())
                        .provider(rec.getProvider())
                        .issueDate(rec.getIssueDate())
                        .expiryDate(rec.getExpiryDate())
                        .daysUntilExpiry(daysUntil)
                        .isExpired(daysUntil < 0)
                        .build());
            }
        }

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .userId(vehicle.getUser().getId())
                .username(vehicle.getUser().getUsername())
                .userEmail(vehicle.getUser().getEmail())
                .registrationNumber(vehicle.getRegistrationNumber())
                .makeAndModel(vehicle.getMakeAndModel())
                .vehicleType(vehicle.getVehicleType())
                .complianceRecords(recordResponses)
                .createdAt(vehicle.getCreatedAt())
                .build();
    }
}
