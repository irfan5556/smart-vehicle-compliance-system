package com.smartvehicle.compliance.repository;

import com.smartvehicle.compliance.entity.NotificationLog;
import com.smartvehicle.compliance.enums.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByComplianceRecordId(Long complianceRecordId);

    boolean existsByComplianceRecordIdAndChannelAndSentAtBetween(
            Long complianceRecordId,
            NotificationChannel channel,
            LocalDateTime start,
            LocalDateTime end
    );
}

