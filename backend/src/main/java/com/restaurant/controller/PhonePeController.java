package com.restaurant.controller;

import com.restaurant.dto.OrderCreateRequest;
import com.restaurant.entity.User;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.PhonePeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/phonepe")
public class PhonePeController {

    private final PhonePeService phonePeService;
    private final UserRepository userRepository;

    public PhonePeController(PhonePeService phonePeService, UserRepository userRepository) {
        this.phonePeService = phonePeService;
        this.userRepository = userRepository;
    }

    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                             @Valid @RequestBody OrderCreateRequest request) {
        try {
            if (userPrincipal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Customer authentication required to initiate payment"));
            }
            User customer = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new IllegalStateException("Authenticated customer not found in system"));

            Map<String, Object> response = phonePeService.initiatePayment(customer, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{merchantTransactionId}")
    public ResponseEntity<?> checkStatus(@PathVariable String merchantTransactionId) {
        try {
            Map<String, Object> response = phonePeService.checkPaymentStatus(merchantTransactionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestBody(required = false) Map<String, Object> body) {
        // PhonePe webhook acknowledgement
        return ResponseEntity.ok(Map.of("status", "RECEIVED"));
    }

    @PostMapping("/simulate-action")
    public ResponseEntity<?> simulateAction(@RequestBody Map<String, String> body) {
        try {
            String mtxnId = body.get("merchantTransactionId");
            String action = body.getOrDefault("action", "SUCCESS");
            Map<String, Object> res = phonePeService.simulatePaymentAction(mtxnId, action);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
