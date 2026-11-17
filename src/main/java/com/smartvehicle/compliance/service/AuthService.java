package com.smartvehicle.compliance.service;

import com.smartvehicle.compliance.dto.request.LoginRequest;
import com.smartvehicle.compliance.dto.request.RegisterRequest;
import com.smartvehicle.compliance.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}

