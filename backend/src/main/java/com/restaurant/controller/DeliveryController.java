package com.restaurant.controller;

import com.restaurant.entity.Order;
import com.restaurant.entity.User;
import com.restaurant.repository.OutletStaffRepository;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    private final OrderService orderService;
    private final OutletStaffRepository outletStaffRepository;
    private final UserRepository userRepository;

    public DeliveryController(OrderService orderService,
                              OutletStaffRepository outletStaffRepository,
                              UserRepository userRepository) {
        this.orderService = orderService;
        this.outletStaffRepository = outletStaffRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getAssignedOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Long deliveryStaffId = userPrincipal.getId();
            List<Order> orders = orderService.getOrdersForDeliveryStaff(deliveryStaffId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateDeliveryStatus(@PathVariable Long orderId,
                                                  @AuthenticationPrincipal UserPrincipal userPrincipal,
                                                  @RequestBody Map<String, String> body) {
        try {
            String nextStatus = body.get("status");
            if (nextStatus == null || nextStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }

            Order updated = orderService.updateDeliveryStatus(orderId, nextStatus.trim(), userPrincipal.getId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available-staff")
    public ResponseEntity<?> getAvailableStaff(@RequestParam(required = false, defaultValue = "1") Long outletId) {
        try {
            List<User> available = outletStaffRepository.findAvailableDeliveryStaffByOutletId(outletId);
            List<User> allStaff = outletStaffRepository.findAllDeliveryStaffByOutletId(outletId);
            Map<String, Object> response = new HashMap<>();
            response.put("available", available);
            response.put("all", allStaff);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/availability")
    public ResponseEntity<?> updateAvailability(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null || (!status.equals("AVAILABLE") && !status.equals("OFFLINE") && !status.equals("BUSY"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid availability status"));
            }

            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            user.setAvailabilityStatus(status);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("status", user.getAvailabilityStatus()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
