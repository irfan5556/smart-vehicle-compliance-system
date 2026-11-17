package com.smartvehicle.compliance.controller;

import com.smartvehicle.compliance.dto.response.ApiResponse;
import com.smartvehicle.compliance.dto.response.VehicleResponse;
import com.smartvehicle.compliance.service.ComplianceSchedulerService;
import com.smartvehicle.compliance.service.VehicleEnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminVehicleController {

    private final VehicleEnrollmentService vehicleEnrollmentService;
    private final ComplianceSchedulerService complianceSchedulerService;

    /**
     * Admin: Retrieve all vehicles across all users with owner metadata.
     */
    @GetMapping("/vehicles")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAllVehicles() {
        log.info("Admin fetching system-wide fleet records");
        List<VehicleResponse> vehicles = vehicleEnrollmentService.getAllVehiclesForAdmin();
        return ResponseEntity.ok(ApiResponse.success("System-wide fleet retrieved successfully", vehicles));
    }

    /**
     * Admin: Delete any vehicle record and associated compliance records.
     */
    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable Long id) {
        log.info("Admin deleting vehicle ID: {}", id);
        vehicleEnrollmentService.deleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted successfully", null));
    }

    /**
     * Admin: Trigger daily 8:00 AM compliance audit check across the entire fleet.
     */
    @PostMapping("/run-audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runDailyAudit() {
        log.info("Admin manually triggered daily compliance audit");
        int dispatchedCount = complianceSchedulerService.triggerManualComplianceAudit();
        return ResponseEntity.ok(ApiResponse.success(
                "Compliance audit executed successfully across all active vehicles",
                Map.of("dispatchedReminders", dispatchedCount)
        ));
    }
}

