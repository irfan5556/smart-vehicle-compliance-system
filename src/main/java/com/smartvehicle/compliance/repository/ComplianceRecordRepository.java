package com.smartvehicle.compliance.repository;

import com.smartvehicle.compliance.entity.ComplianceRecord;
import com.smartvehicle.compliance.enums.ComplianceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplianceRecordRepository extends JpaRepository<ComplianceRecord, Long> {

    @Query("SELECT c FROM ComplianceRecord c " +
           "JOIN FETCH c.vehicle v " +
           "JOIN FETCH v.user u " +
           "WHERE c.expiryDate IN :targetDates")
    List<ComplianceRecord> findExpiringRecordsWithVehicleAndUser(@Param("targetDates") Collection<LocalDate> targetDates);

    List<ComplianceRecord> findByVehicleId(Long vehicleId);

    Optional<ComplianceRecord> findByVehicleIdAndComplianceType(Long vehicleId, ComplianceType complianceType);
}

