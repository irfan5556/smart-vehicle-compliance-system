package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.entity.ComplianceRecord;
import com.smartvehicle.compliance.repository.ComplianceRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ComplianceSchedulerService {

    private final ComplianceRecordRepository complianceRecordRepository;
    private final NotificationService notificationService;

    /**
     * Cron expression configured in application.properties (default: "0 0 8 * * ?" = Daily at 08:00 AM).
     * Scans for records expiring today, in 7 days, or in 30 days and triggers async notifications.
     */
    @Scheduled(cron = "${compliance.cron.reminder-schedule:0 0 8 * * ?}")
    @Transactional(readOnly = true)
    public void executeDailyComplianceAudit() {
        LocalDate today = LocalDate.now();
        LocalDate in7Days = today.plusDays(7);
        LocalDate in30Days = today.plusDays(30);

        List<LocalDate> targetDates = List.of(today, in7Days, in30Days);

        log.info("Starting Daily Vehicle Compliance Audit for target dates: [Today: {}, +7D: {}, +30D: {}]",
                today, in7Days, in30Days);

        List<ComplianceRecord> expiringRecords = complianceRecordRepository
                .findExpiringRecordsWithVehicleAndUser(targetDates);

        log.info("Identified {} compliance record(s) matching renewal notice thresholds", expiringRecords.size());

        for (ComplianceRecord record : expiringRecords) {
            long daysRemaining = ChronoUnit.DAYS.between(today, record.getExpiryDate());
            notificationService.sendComplianceExpiryReminderAsync(record, daysRemaining);
        }

        log.info("Daily Vehicle Compliance Audit completed. Dispatched {} notifications asynchronously.",
                expiringRecords.size());
    }

    /**
     * Manual invocation trigger useful for admin dashboard triggers or integration testing.
     */
    public int triggerManualComplianceAudit() {
        LocalDate today = LocalDate.now();
        LocalDate in7Days = today.plusDays(7);
        LocalDate in30Days = today.plusDays(30);

        List<LocalDate> targetDates = List.of(today, in7Days, in30Days);
        List<ComplianceRecord> expiringRecords = complianceRecordRepository
                .findExpiringRecordsWithVehicleAndUser(targetDates);

        for (ComplianceRecord record : expiringRecords) {
            long daysRemaining = ChronoUnit.DAYS.between(today, record.getExpiryDate());
            notificationService.sendComplianceExpiryReminderAsync(record, daysRemaining);
        }

        return expiringRecords.size();
    }
}

