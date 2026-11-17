package com.smartvehicle.compliance.repository;

import com.smartvehicle.compliance.entity.Vehicle;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    @EntityGraph(attributePaths = {"complianceRecords", "user"})
    Optional<Vehicle> findByRegistrationNumberIgnoreCase(String registrationNumber);

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);

    @EntityGraph(attributePaths = {"complianceRecords", "user"})
    List<Vehicle> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"complianceRecords", "user"})
    List<Vehicle> findByUserEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"complianceRecords", "user"})
    List<Vehicle> findByUserEmailIgnoreCaseOrUserUsernameIgnoreCase(String email, String username);

    @Override
    @EntityGraph(attributePaths = {"complianceRecords", "user"})
    List<Vehicle> findAll();
}
