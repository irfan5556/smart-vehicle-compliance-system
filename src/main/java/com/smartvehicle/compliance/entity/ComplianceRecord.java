package com.smartvehicle.compliance.entity;

import com.smartvehicle.compliance.enums.ComplianceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "compliance_records",
    indexes = {
        @Index(name = "idx_compliance_expiry_date", columnList = "expiry_date"),
        @Index(name = "idx_compliance_vehicle_type", columnList = "vehicle_id, compliance_type")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "compliance_type", nullable = false, length = 30)
    private ComplianceType complianceType;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "provider", length = 150)
    private String provider;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

