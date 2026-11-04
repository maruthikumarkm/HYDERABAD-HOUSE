package com.restaurant.controller;

import com.restaurant.dto.*;
import com.restaurant.entity.User;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Authentication failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse response = authService.register(registerRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = authService.handleForgotPassword(request);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", msg);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        User user = userRepository.findById(userPrincipal.getId()).orElse(null);
        Map<String, Object> res = new HashMap<>();
        res.put("id", userPrincipal.getId());
        res.put("name", userPrincipal.getName());
        res.put("email", userPrincipal.getEmail());
        res.put("role", userPrincipal.getRole());
        res.put("outletId", userPrincipal.getOutletId());
        if (user != null) {
            res.put("phone", user.getPhone());
        }
        return ResponseEntity.ok(res);
    }
}
