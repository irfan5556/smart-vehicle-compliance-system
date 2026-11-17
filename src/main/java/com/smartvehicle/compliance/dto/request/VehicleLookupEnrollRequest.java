package com.smartvehicle.compliance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleLookupEnrollRequest {

    @NotBlank(message = "Registration number is required")
    @Pattern(
        regexp = "^[A-Za-z]{2}[0-9]{1,2}[A-Za-z]{0,3}[0-9]{4}$",
        message = "Invalid Indian registration number format (e.g., TN09BX4521, PY01BU1938, MH12DE1432)"
    )
    private String registrationNumber;

    private Long userId;

    // Optional toggle to force sandbox simulator mode
    @Builder.Default
    private Boolean useSandbox = false;

    // Optional manual registration fields
    private String makeAndModel;
    private String vehicleType;
    private String insurancePolicyNumber;
    private String insuranceProvider;
    private LocalDate insuranceExpiryDate;
    private String pucCertificateNumber;
    private String pucProvider;
    private LocalDate pucExpiryDate;
    private String roadTaxCertificateNumber;
    private LocalDate roadTaxExpiryDate;
}
