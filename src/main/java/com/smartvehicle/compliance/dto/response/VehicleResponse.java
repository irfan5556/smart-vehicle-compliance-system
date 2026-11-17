package com.smartvehicle.compliance.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userEmail;
    private String registrationNumber;
    private String makeAndModel;
    private String vehicleType;
    private List<ComplianceRecordResponse> complianceRecords;
    private LocalDateTime createdAt;
}

