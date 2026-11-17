package com.smartvehicle.compliance.config;

import com.smartvehicle.compliance.entity.ComplianceRecord;
import com.smartvehicle.compliance.entity.User;
import com.smartvehicle.compliance.entity.Vehicle;
import com.smartvehicle.compliance.enums.ComplianceType;
import com.smartvehicle.compliance.enums.Role;
import com.smartvehicle.compliance.repository.ComplianceRecordRepository;
import com.smartvehicle.compliance.repository.UserRepository;
import com.smartvehicle.compliance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ComplianceRecordRepository complianceRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Seed or retrieve Admin account: admin@compliance.com / admin123 (ROLE_ADMIN)
        User adminUser = userRepository.findByEmailIgnoreCase("admin@compliance.com").orElseGet(() -> {
            log.info("Bootstrapping Admin account: admin@compliance.com (ROLE_ADMIN)...");
            User admin = User.builder()
                    .username("admin")
                    .email("admin@compliance.com")
                    .password(passwordEncoder.encode("admin123"))
                    .phoneNumber("+919876543219")
                    .role(Role.ROLE_ADMIN)
                    .build();
            return userRepository.save(admin);
        });

        // 2. Seed or retrieve Regular User account: user@compliance.com / user123 (ROLE_USER)
        User regularUser = userRepository.findByEmailIgnoreCase("user@compliance.com").orElseGet(() -> {
            log.info("Bootstrapping User account: user@compliance.com (ROLE_USER)...");
            User user = User.builder()
                    .username("john_doe")
                    .email("user@compliance.com")
                    .password(passwordEncoder.encode("user123"))
                    .phoneNumber("+919876543210")
                    .role(Role.ROLE_USER)
                    .build();
            return userRepository.save(user);
        });

        // 3. Seed initial fleet vehicles if database is empty
        if (vehicleRepository.count() == 0) {
            log.info("Seeding initial fleet across users into database...");

            LocalDate today = LocalDate.now();

            // Vehicle 1: Hyundai Creta -> Belongs to regularUser
            Vehicle v1 = Vehicle.builder()
                    .user(regularUser)
                    .registrationNumber("TN09BX4521")
                    .makeAndModel("HYUNDAI CRETA SX")
                    .vehicleType("Motor Car (LMV)")
                    .build();
            v1.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.INSURANCE)
                    .certificateNumber("POL-982341")
                    .provider("ICICI Lombard")
                    .issueDate(today.minusMonths(6))
                    .expiryDate(today.plusDays(58))
                    .build());
            v1.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.PUC)
                    .certificateNumber("PUC-56128")
                    .provider("Authorized Emission Center")
                    .issueDate(today.minusMonths(5))
                    .expiryDate(today.plusDays(7)) // 7 days trigger
                    .build());
            vehicleRepository.save(v1);

            // Vehicle 2: Maruti Swift -> Belongs to regularUser (Has Expired and Today records)
            Vehicle v2 = Vehicle.builder()
                    .user(regularUser)
                    .registrationNumber("DL03CC8812")
                    .makeAndModel("MARUTI SUZUKI SWIFT VXI")
                    .vehicleType("Motor Car (LMV)")
                    .build();
            v2.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.INSURANCE)
                    .certificateNumber("BAJ-443210")
                    .provider("Bajaj Allianz")
                    .issueDate(today.minusYears(1))
                    .expiryDate(today.minusDays(30)) // Expired!
                    .build());
            v2.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.PUC)
                    .certificateNumber("PUC-90122")
                    .provider("Clean Air Center DL")
                    .issueDate(today.minusMonths(6))
                    .expiryDate(today) // TODAY trigger!
                    .build());
            vehicleRepository.save(v2);

            // Vehicle 3: Tata Nexon EV -> Belongs to adminUser (30 days reminder)
            Vehicle v3 = Vehicle.builder()
                    .user(adminUser)
                    .registrationNumber("MH12DE1432")
                    .makeAndModel("TATA NEXON EV FEARLESS")
                    .vehicleType("Electric Car (LMV)")
                    .build();
            v3.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.INSURANCE)
                    .certificateNumber("HDFC-ERGO-776")
                    .provider("HDFC ERGO General Insurance")
                    .issueDate(today.minusMonths(11))
                    .expiryDate(today.plusDays(30)) // 30 days trigger!
                    .build());
            v3.addComplianceRecord(ComplianceRecord.builder()
                    .complianceType(ComplianceType.ROAD_TAX)
                    .certificateNumber("TAX-MH12DE1432")
                    .provider("Maharashtra Motor Vehicle Dept")
                    .issueDate(today.minusYears(2))
                    .expiryDate(today.plusYears(13))
                    .build());
            vehicleRepository.save(v3);

            log.info("Database successfully seeded: 2 vehicles for regularUser, 1 vehicle for adminUser.");
        }
    }
}
