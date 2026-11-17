package com.smartvehicle.compliance.controller;

import com.smartvehicle.compliance.dto.request.VehicleLookupEnrollRequest;
import com.smartvehicle.compliance.dto.response.ApiResponse;
import com.smartvehicle.compliance.dto.response.VehicleResponse;
import com.smartvehicle.compliance.service.ComplianceSchedulerService;
import com.smartvehicle.compliance.service.VehicleEnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Slf4j
public class VehicleComplianceController {

    private final VehicleEnrollmentService vehicleEnrollmentService;
    private final ComplianceSchedulerService complianceSchedulerService;

    /**
     * User Scoping: Return only vehicles belonging to the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getMyVehicles(Authentication authentication) {
        String userIdentifier = authentication != null ? authentication.getName() : "user@compliance.com";
        log.info("Fetching scoped vehicles for authenticated user: {}", userIdentifier);
        List<VehicleResponse> responses = vehicleEnrollmentService.getVehiclesByUserEmail(userIdentifier);
        return ResponseEntity.ok(ApiResponse.success("User vehicles retrieved successfully", responses));
    }

    /**
     * Looks up live vehicle details via RapidAPI RTO and enrolls vehicle with compliance records in MySQL.
     * Automatically links vehicle to the authenticated user.
     */
    @PostMapping("/lookup-and-enroll")
    public ResponseEntity<ApiResponse<VehicleResponse>> lookupAndEnrollVehicle(
            @Valid @RequestBody VehicleLookupEnrollRequest request,
            Authentication authentication) {

        log.info("Received enrollment request for plate: {}", request.getRegistrationNumber());
        String userIdentifier = authentication != null ? authentication.getName() : null;

        VehicleResponse response;
        if (userIdentifier != null && request.getUserId() == null) {
            response = vehicleEnrollmentService.lookupAndEnrollVehicleForUser(
                    request,
                    userIdentifier
            );
        } else {
            response = vehicleEnrollmentService.lookupAndEnrollVehicle(request);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vehicle successfully enrolled with real-time RTO compliance data", response));
    }

    /**
     * Retrieves vehicle details and active compliance records by registration plate.
     */
    @GetMapping("/{registrationNumber}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleByPlate(
            @PathVariable String registrationNumber) {

        VehicleResponse response = vehicleEnrollmentService.getVehicleByRegistrationNumber(registrationNumber);
        return ResponseEntity.ok(ApiResponse.success("Vehicle retrieved successfully", response));
    }

    /**
     * Retrieves all vehicles registered under a specific user ID.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getVehiclesByUser(
            @PathVariable Long userId) {

        List<VehicleResponse> responses = vehicleEnrollmentService.getVehiclesByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("User vehicles retrieved successfully", responses));
    }

    /**
     * Manual trigger for compliance audit notifications.
     */
    @PostMapping("/audit/trigger")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerComplianceAudit() {
        int dispatchedCount = complianceSchedulerService.triggerManualComplianceAudit();
        return ResponseEntity.ok(ApiResponse.success(
                "Compliance audit executed successfully",
                Map.of("dispatchedReminders", dispatchedCount)
        ));
    }
}
