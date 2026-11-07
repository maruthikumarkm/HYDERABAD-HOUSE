package com.restaurant.controller;

import com.restaurant.dto.OrderStatusUpdateRequest;
import com.restaurant.entity.Order;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kitchen")
public class KitchenController {

    private final OrderService orderService;

    public KitchenController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getKitchenOrders(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                              @RequestParam(required = false) Long outletId) {
        Long targetOutletId = outletId != null ? outletId : (userPrincipal != null ? userPrincipal.getOutletId() : null);
        if (targetOutletId == null) {
            targetOutletId = 1L;
        }

        List<Order> orders = orderService.getOrdersForKitchen(targetOutletId);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId,
                                               @AuthenticationPrincipal UserPrincipal userPrincipal,
                                               @Valid @RequestBody OrderStatusUpdateRequest request) {
        try {
            Long userId = userPrincipal != null ? userPrincipal.getId() : 1L;
            Order updated = orderService.updateOrderStatus(orderId, request, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/party-orders")
    public ResponseEntity<?> getPartyOrders(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                            @RequestParam(required = false) Long outletId) {
        Long targetOutletId = outletId != null ? outletId : (userPrincipal != null ? userPrincipal.getOutletId() : null);
        List<Order> partyOrders = orderService.getPartyOrdersForKitchen(targetOutletId);
        return ResponseEntity.ok(partyOrders);
    }
}
