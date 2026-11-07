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
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            Map<String, String> err = new HashMap<>();
            String msg = e.getMessage();
            if (msg == null || msg.equalsIgnoreCase("Bad credentials")) {
                msg = "Invalid email or password. Please verify your credentials.";
            }
            err.put("error", msg);
            return ResponseEntity.status(401).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage() != null ? e.getMessage() : "Authentication failed");
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
        try {
            Map<String, Object> res = authService.handleForgotPassword(request);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Map<String, Object> res = authService.resetPassword(request);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
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
            res.put("createdAt", user.getCreatedAt());
        }
        return ResponseEntity.ok(res);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @Valid @RequestBody UpdateProfileRequest request) {
        if (userPrincipal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        try {
            User updated = authService.updateUserProfile(userPrincipal.getId(), request);
            Map<String, Object> res = new HashMap<>();
            res.put("id", updated.getId());
            res.put("name", updated.getName());
            res.put("email", updated.getEmail());
            res.put("phone", updated.getPhone());
            res.put("role", updated.getRole().getName());
            res.put("message", "Profile updated successfully.");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
