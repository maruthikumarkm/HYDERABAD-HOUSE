package com.restaurant.controller;

import com.restaurant.dto.OutletOverrideRequest;
import com.restaurant.dto.WorkloadUpdateRequest;
import com.restaurant.entity.Notification;
import com.restaurant.entity.Order;
import com.restaurant.entity.Outlet;
import com.restaurant.entity.User;
import com.restaurant.repository.OutletStaffRepository;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.MenuService;
import com.restaurant.service.NotificationService;
import com.restaurant.service.OrderService;
import com.restaurant.service.OutletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/outlet-manager")
public class OutletManagerController {

    private final OrderService orderService;
    private final OutletService outletService;
    private final MenuService menuService;
    private final NotificationService notificationService;
    private final OutletStaffRepository outletStaffRepository;

    public OutletManagerController(OrderService orderService,
                                   OutletService outletService,
                                   MenuService menuService,
                                   NotificationService notificationService,
                                   OutletStaffRepository outletStaffRepository) {
        this.orderService = orderService;
        this.outletService = outletService;
        this.menuService = menuService;
        this.notificationService = notificationService;
        this.outletStaffRepository = outletStaffRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                          @RequestParam(required = false) Long outletId) {
        Long targetOutletId = outletId != null ? outletId : (userPrincipal.getOutletId() != null ? userPrincipal.getOutletId() : 1L);
        Outlet outlet = outletService.getOutletById(targetOutletId);
        List<Order> orders = orderService.getAllOrdersForOutlet(targetOutletId);

        int totalOrders = orders.size();
        int activeOrders = 0;
        int lateOrders = 0;
        BigDecimal totalSales = BigDecimal.ZERO;
        int totalPrepTime = 0;
        int prepOrdersCount = 0;

        for (Order o : orders) {
            if (Arrays.asList("PLACED", "CONFIRMED", "PREPARING").contains(o.getStatus())) {
                activeOrders++;
            }
            if (Boolean.TRUE.equals(o.getIsLate())) {
                lateOrders++;
            }
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                totalSales = totalSales.add(o.getTotalAmount());
            }
            if (o.getPromisedPrepTimeMinutes() != null) {
                totalPrepTime += o.getPromisedPrepTimeMinutes();
                prepOrdersCount++;
            }
        }

        double avgPrepTime = prepOrdersCount > 0 ? (double) totalPrepTime / prepOrdersCount : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("outlet", outlet);
        summary.put("totalOrders", totalOrders);
        summary.put("activeOrders", activeOrders);
        summary.put("lateOrders", lateOrders);
        summary.put("totalSales", totalSales);
        summary.put("avgPrepTimeMinutes", Math.round(avgPrepTime * 10.0) / 10.0);
        summary.put("orders", orders);
        summary.put("availableDeliveryStaff", outletStaffRepository.findAvailableDeliveryStaffByOutletId(targetOutletId));

        return ResponseEntity.ok(summary);
    }

    @PostMapping("/orders/{orderId}/assign-delivery")
    public ResponseEntity<?> assignDelivery(@PathVariable Long orderId,
                                            @AuthenticationPrincipal UserPrincipal userPrincipal,
                                            @RequestBody Map<String, Long> body) {
        try {
            Long deliveryStaffId = body.get("deliveryStaffId");
            if (deliveryStaffId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "deliveryStaffId is required"));
            }
            Long managerId = userPrincipal != null ? userPrincipal.getId() : 1L;
            Order updated = orderService.assignDeliveryStaff(orderId, deliveryStaffId, managerId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/delivery-staff")
    public ResponseEntity<?> getDeliveryStaff(@RequestParam(required = false, defaultValue = "1") Long outletId) {
        try {
            List<User> available = outletStaffRepository.findAvailableDeliveryStaffByOutletId(outletId);
            List<User> allStaff = outletStaffRepository.findAllDeliveryStaffByOutletId(outletId);
            Map<String, Object> res = new HashMap<>();
            res.put("available", available);
            res.put("all", allStaff);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/inventory/{menuItemId}")
    public ResponseEntity<?> toggleStock(@RequestParam Long outletId,
                                         @PathVariable Long menuItemId,
                                         @RequestBody Map<String, Boolean> body) {
        Boolean isAvailable = body.get("isAvailable");
        OutletOverrideRequest req = new OutletOverrideRequest();
        req.setIsAvailable(isAvailable != null ? isAvailable : false);
        return ResponseEntity.ok(menuService.setOutletItemOverride(outletId, menuItemId, req));
    }

    @PatchMapping("/workload")
    public ResponseEntity<?> updateWorkload(@RequestParam Long outletId,
                                            @Valid @RequestBody WorkloadUpdateRequest request) {
        return ResponseEntity.ok(outletService.updateWorkload(outletId, request));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Notification>> getAlerts(@RequestParam Long outletId) {
        return ResponseEntity.ok(notificationService.getOutletNotifications(outletId));
    }
}
