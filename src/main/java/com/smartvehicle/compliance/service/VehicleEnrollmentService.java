package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.dto.request.VehicleLookupEnrollRequest;
import com.smartvehicle.compliance.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleEnrollmentService {

    /**
     * Looks up a vehicle in real-time or sandbox, or processes manual entry,
     * and enrolls the vehicle under the specified user ID.
     */
    VehicleResponse lookupAndEnrollVehicle(VehicleLookupEnrollRequest request);

    /**
     * Overload: looks up and enrolls a vehicle by plate string for an authenticated user.
     */
    VehicleResponse lookupAndEnrollVehicleForUser(String plate, String userEmail);

    /**
     * Supports full request payload (sandbox toggle and manual registration fields) for an authenticated user.
     */
    VehicleResponse lookupAndEnrollVehicleForUser(VehicleLookupEnrollRequest request, String userEmail);

    /**
     * Fetches details of an enrolled vehicle by registration number.
     */
    VehicleResponse getVehicleByRegistrationNumber(String registrationNumber);

    /**
     * Retrieves all vehicles enrolled under a specific user ID.
     */
    List<VehicleResponse> getVehiclesByUserId(Long userId);

    /**
     * Retrieves vehicles scoped to a specific user's email or username.
     */
    List<VehicleResponse> getVehiclesByUserEmail(String email);

    /**
     * Retrieves all vehicles across all users in the fleet (Admin only).
     */
    List<VehicleResponse> getAllVehiclesForAdmin();

    /**
     * Deletes a vehicle record and associated compliance records (Admin only).
     */
    void deleteVehicle(Long vehicleId);
}
