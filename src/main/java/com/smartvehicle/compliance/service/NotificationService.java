package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.entity.ComplianceRecord;

public interface NotificationService {

    /**
     * Sends an expiry reminder notification asynchronously to the vehicle owner
     * and logs the attempt in NotificationLog.
     *
     * @param record The compliance record nearing expiration
     * @param daysRemaining Number of days remaining (0, 7, or 30)
     */
    void sendComplianceExpiryReminderAsync(ComplianceRecord record, long daysRemaining);
}

