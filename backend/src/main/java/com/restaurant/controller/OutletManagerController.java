package com.restaurant.controller;

import com.restaurant.dto.OutletOverrideRequest;
import com.restaurant.dto.WorkloadUpdateRequest;
import com.restaurant.entity.Notification;
import com.restaurant.entity.Order;
import com.restaurant.entity.Outlet;
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

    public OutletManagerController(OrderService orderService,
                                   OutletService outletService,
                                   MenuService menuService,
                                   NotificationService notificationService) {
        this.orderService = orderService;
        this.outletService = outletService;
        this.menuService = menuService;
        this.notificationService = notificationService;
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

        double avgPrepTime = prepOrdersCount > 0 ? (double) totalPrepTime / prepOrdersCount : outlet.getMinPrepTimeMinutes();

        Map<String, Object> summary = new HashMap<>();
        summary.put("outlet", outlet);
        summary.put("totalOrders", totalOrders);
        summary.put("activeOrders", activeOrders);
        summary.put("lateOrders", lateOrders);
        summary.put("totalSales", totalSales);
        summary.put("avgPrepTimeMinutes", Math.round(avgPrepTime * 10.0) / 10.0);
        summary.put("orders", orders);

        return ResponseEntity.ok(summary);
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
