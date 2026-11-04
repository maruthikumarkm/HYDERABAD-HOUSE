package com.restaurant.controller;

import com.restaurant.dto.MenuItemRequest;
import com.restaurant.dto.OutletOverrideRequest;
import com.restaurant.entity.MenuItem;
import com.restaurant.service.AnalyticsService;
import com.restaurant.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MenuService menuService;
    private final AnalyticsService analyticsService;

    public AdminController(MenuService menuService, AnalyticsService analyticsService) {
        this.menuService = menuService;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getManagementAnalytics());
    }

    @PostMapping("/items")
    public ResponseEntity<MenuItem> createItem(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.createMenuItem(request));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<MenuItem> updateItem(@PathVariable Long id, @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.updateMenuItem(id, request));
    }

    @PatchMapping("/items/{id}/status")
    public ResponseEntity<MenuItem> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean active = body.getOrDefault("isActive", true);
        return ResponseEntity.ok(menuService.toggleItemStatus(id, active));
    }

    @PostMapping("/items/{itemId}/outlet-override")
    public ResponseEntity<?> setOutletOverride(@PathVariable Long itemId,
                                               @RequestParam Long outletId,
                                               @RequestBody OutletOverrideRequest request) {
        return ResponseEntity.ok(menuService.setOutletItemOverride(outletId, itemId, request));
    }
}
