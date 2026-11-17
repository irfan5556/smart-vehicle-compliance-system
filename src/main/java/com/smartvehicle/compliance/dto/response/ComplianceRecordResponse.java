package com.smartvehicle.compliance.dto.response;

import com.smartvehicle.compliance.enums.ComplianceType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceRecordResponse {
    private Long id;
    private ComplianceType complianceType;
    private String certificateNumber;
    private String provider;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private Long daysUntilExpiry;
    private boolean isExpired;
}

