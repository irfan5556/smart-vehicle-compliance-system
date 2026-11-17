package com.smartvehicle.compliance.service.impl;

import com.smartvehicle.compliance.entity.ComplianceRecord;
import com.smartvehicle.compliance.entity.NotificationLog;
import com.smartvehicle.compliance.entity.User;
import com.smartvehicle.compliance.entity.Vehicle;
import com.smartvehicle.compliance.enums.NotificationChannel;
import com.smartvehicle.compliance.enums.NotificationStatus;
import com.smartvehicle.compliance.repository.NotificationLogRepository;
import com.smartvehicle.compliance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationLogRepository notificationLogRepository;

    @Value("${app.mail.from:no-reply@smartvehiclecompliance.com}")
    private String fromEmail;

    @Override
    @Async("notificationTaskExecutor")
    public void sendComplianceExpiryReminderAsync(ComplianceRecord record, long daysRemaining) {
        Vehicle vehicle = record.getVehicle();
        User user = vehicle.getUser();
        String recipientEmail = user.getEmail();

        log.info("Executing async reminder dispatch: Record ID {}, Vehicle {}, Recipient {}, Days remaining: {}",
                record.getId(), vehicle.getRegistrationNumber(), recipientEmail, daysRemaining);

        String subject = buildSubject(vehicle.getRegistrationNumber(), record.getComplianceType().name(), daysRemaining);
        String body = buildBody(user.getUsername(), vehicle, record, daysRemaining);

        NotificationStatus status = NotificationStatus.SENT;
        String errorMessage = null;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Successfully dispatched email reminder for record ID {} to {}", record.getId(), recipientEmail);

        } catch (Exception ex) {
            log.error("Failed to send email reminder for compliance record ID {}: {}", record.getId(), ex.getMessage(), ex);
            status = NotificationStatus.FAILED;
            errorMessage = ex.getMessage() != null && ex.getMessage().length() > 990
                    ? ex.getMessage().substring(0, 990)
                    : ex.getMessage();
        } finally {
            NotificationLog logEntry = NotificationLog.builder()
                    .complianceRecordId(record.getId())
                    .channel(NotificationChannel.EMAIL)
                    .recipient(recipientEmail)
                    .sentAt(LocalDateTime.now())
                    .status(status)
                    .errorMessage(errorMessage)
                    .build();

            notificationLogRepository.save(logEntry);
        }
    }

    private String buildSubject(String plate, String complianceType, long daysRemaining) {
        if (daysRemaining == 0) {
            return String.format("[CRITICAL ACTION REQUIRED] %s for Vehicle %s EXPIRES TODAY", complianceType, plate);
        } else if (daysRemaining == 7) {
            return String.format("[REMINDER] %s for Vehicle %s expires in 7 days", complianceType, plate);
        } else {
            return String.format("[NOTICE] %s for Vehicle %s expires in %d days", complianceType, plate, daysRemaining);
        }
    }

    private String buildBody(String username, Vehicle vehicle, ComplianceRecord record, long daysRemaining) {
        String urgencyMessage = daysRemaining == 0
                ? "Your document expires TODAY. Operating this vehicle without valid documentation is subject to severe fines."
                : String.format("Your document is due to expire in %d day(s). Please arrange for renewal immediately.", daysRemaining);

        return String.format("""
                Dear %s,

                This is an automated compliance notice from the Smart Vehicle Compliance System.

                =======================================================
                COMPLIANCE EXPIRATION DETAILS
                =======================================================
                Vehicle Registration : %s
                Make & Model         : %s
                Compliance Type      : %s
                Certificate / Policy : %s
                Provider             : %s
                Expiration Date      : %s
                Days Remaining       : %d
                =======================================================

                %s

                Please ensure your records are updated once renewed.

                Regards,
                Smart Vehicle Compliance Automation Engine
                """,
                username,
                vehicle.getRegistrationNumber(),
                vehicle.getMakeAndModel(),
                record.getComplianceType(),
                record.getCertificateNumber() != null ? record.getCertificateNumber() : "N/A",
                record.getProvider() != null ? record.getProvider() : "Authorized Authority",
                record.getExpiryDate(),
                daysRemaining,
                urgencyMessage
        );
    }
}

