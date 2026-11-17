package com.smartvehicle.compliance.service.impl;

import com.smartvehicle.compliance.dto.request.LoginRequest;
import com.smartvehicle.compliance.dto.request.RegisterRequest;
import com.smartvehicle.compliance.dto.response.AuthResponse;
import com.smartvehicle.compliance.entity.User;
import com.smartvehicle.compliance.enums.Role;
import com.smartvehicle.compliance.repository.UserRepository;
import com.smartvehicle.compliance.security.JwtService;
import com.smartvehicle.compliance.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing user registration for email: {}", request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "+910000000000")
                .role(Role.ROLE_USER)
                .build();

        User savedUser = userRepository.save(user);

        String jwtToken = jwtService.generateToken(
                Map.of("role", savedUser.getRole().name(), "userId", savedUser.getId()),
                savedUser
        );

        log.info("User registered successfully with ID: {}", savedUser.getId());

        return AuthResponse.builder()
                .token(jwtToken)
                .role(savedUser.getRole().name())
                .email(savedUser.getEmail())
                .username(savedUser.getUsername())
                .userId(savedUser.getId())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail().trim();
        log.info("Authenticating user credentials for: {}", identifier);

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        String jwtToken = jwtService.generateToken(
                Map.of("role", user.getRole().name(), "userId", user.getId()),
                user
        );

        log.info("User {} authenticated successfully with role {}", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .email(user.getEmail())
                .username(user.getUsername())
                .userId(user.getId())
                .build();
    }
}

