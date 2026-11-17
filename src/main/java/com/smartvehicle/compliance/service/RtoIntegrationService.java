package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.dto.response.RtoVehicleApiResponse;

import java.time.LocalDate;
import java.util.Optional;

public interface RtoIntegrationService {

    /**
     * Looks up vehicle registration details via live RapidAPI RTO,
     * automatically falling back to the Parivahan Sandbox Simulator if third-party service fails.
     */
    RtoVehicleApiResponse fetchVehicleDetails(String registrationNumber);

    /**
     * Directly generates authentic, realistic Indian vehicle compliance records
     * via the internal Parivahan Sandbox Simulator without incurring external API costs.
     */
    RtoVehicleApiResponse generateSandboxVehicleDetails(String registrationNumber);

    /**
     * Resilient multi-format date parser supporting diverse RTO date strings.
     */
    Optional<LocalDate> parseRtoDate(String dateStr);
}
