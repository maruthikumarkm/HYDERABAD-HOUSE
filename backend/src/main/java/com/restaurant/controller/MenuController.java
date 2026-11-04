package com.restaurant.controller;

import com.restaurant.entity.AddOn;
import com.restaurant.entity.MenuCategory;
import com.restaurant.entity.MenuItem;
import com.restaurant.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<MenuCategory>> getCategories() {
        return ResponseEntity.ok(menuService.getAllActiveCategories());
    }

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getAllItems() {
        return ResponseEntity.ok(menuService.getAllActiveItems());
    }

    @GetMapping("/outlet/{outletId}")
    public ResponseEntity<List<Map<String, Object>>> getMenuItemsForOutlet(@PathVariable Long outletId) {
        return ResponseEntity.ok(menuService.getMenuItemsForOutlet(outletId));
    }

    @GetMapping("/items/{itemId}/add-ons")
    public ResponseEntity<List<AddOn>> getAddOnsForItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(menuService.getAddOnsForItem(itemId));
    }
}
