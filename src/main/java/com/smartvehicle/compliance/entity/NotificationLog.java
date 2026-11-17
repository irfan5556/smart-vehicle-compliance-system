package com.smartvehicle.compliance.entity;

import com.smartvehicle.compliance.enums.NotificationChannel;
import com.smartvehicle.compliance.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "notification_logs",
    indexes = {
        @Index(name = "idx_notif_compliance_id", columnList = "compliance_record_id"),
        @Index(name = "idx_notif_sent_at", columnList = "sent_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "compliance_record_id", nullable = false)
    private Long complianceRecordId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Column(name = "recipient", length = 150)
    private String recipient;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;
}

