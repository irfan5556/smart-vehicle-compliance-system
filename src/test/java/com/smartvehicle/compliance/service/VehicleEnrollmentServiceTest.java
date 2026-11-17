package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.dto.request.VehicleLookupEnrollRequest;
import com.smartvehicle.compliance.dto.response.RtoVehicleApiResponse;
import com.smartvehicle.compliance.dto.response.VehicleResponse;
import com.smartvehicle.compliance.entity.User;
import com.smartvehicle.compliance.entity.Vehicle;
import com.smartvehicle.compliance.enums.ComplianceType;
import com.smartvehicle.compliance.enums.Role;
import com.smartvehicle.compliance.repository.ComplianceRecordRepository;
import com.smartvehicle.compliance.repository.UserRepository;
import com.smartvehicle.compliance.repository.VehicleRepository;
import com.smartvehicle.compliance.service.impl.VehicleEnrollmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleEnrollmentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ComplianceRecordRepository complianceRecordRepository;

    @Mock
    private RtoIntegrationService rtoIntegrationService;

    @InjectMocks
    private VehicleEnrollmentServiceImpl vehicleEnrollmentService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .phoneNumber("+919876543210")
                .role(Role.ROLE_USER)
                .build();
    }

    @Test
    @DisplayName("Should successfully lookup and enroll vehicle with live RTO compliance dates")
    void testLookupAndEnrollVehicle_Success() {
        String plate = "TN09BX4521";
        VehicleLookupEnrollRequest request = VehicleLookupEnrollRequest.builder()
                .registrationNumber(plate)
                .userId(1L)
                .build();

        RtoVehicleApiResponse mockRtoResponse = RtoVehicleApiResponse.builder()
                .registrationNumber(plate)
                .makerModel("HYUNDAI CRETA SX")
                .vehicleClass("LMV (Car)")
                .insuranceUpto("31-Dec-2026")
                .insuranceCompany("ICICI Lombard")
                .insurancePolicyNumber("POL-100293")
                .puccUpto("15-May-2026")
                .puccNumber("PUC-8877")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(rtoIntegrationService.fetchVehicleDetails(plate)).thenReturn(mockRtoResponse);
        when(rtoIntegrationService.parseRtoDate("31-Dec-2026")).thenReturn(Optional.of(LocalDate.of(2026, 12, 31)));
        when(rtoIntegrationService.parseRtoDate("15-May-2026")).thenReturn(Optional.of(LocalDate.of(2026, 5, 15)));
        when(rtoIntegrationService.parseRtoDate(null)).thenReturn(Optional.empty());

        when(vehicleRepository.findByRegistrationNumberIgnoreCase(plate)).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
            Vehicle v = invocation.getArgument(0);
            v.setId(10L);
            return v;
        });

        VehicleResponse response = vehicleEnrollmentService.lookupAndEnrollVehicle(request);

        assertThat(response).isNotNull();
        assertThat(response.getRegistrationNumber()).isEqualTo(plate);
        assertThat(response.getMakeAndModel()).isEqualTo("HYUNDAI CRETA SX");
        assertThat(response.getComplianceRecords()).hasSize(2);

        boolean hasInsurance = response.getComplianceRecords().stream()
                .anyMatch(r -> r.getComplianceType() == ComplianceType.INSURANCE &&
                        r.getExpiryDate().equals(LocalDate.of(2026, 12, 31)));
        boolean hasPuc = response.getComplianceRecords().stream()
                .anyMatch(r -> r.getComplianceType() == ComplianceType.PUC &&
                        r.getExpiryDate().equals(LocalDate.of(2026, 5, 15)));

        assertThat(hasInsurance).isTrue();
        assertThat(hasPuc).isTrue();

        verify(vehicleRepository, times(1)).save(any(Vehicle.class));
    }
}

