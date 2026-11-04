package com.restaurant.controller;

import com.restaurant.dto.PartyOrderRequest;
import com.restaurant.dto.PartyOrderStatusRequest;
import com.restaurant.entity.PartyOrder;
import com.restaurant.service.PartyOrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/party-orders")
public class PartyOrderController {

    private final PartyOrderService partyOrderService;

    public PartyOrderController(PartyOrderService partyOrderService) {
        this.partyOrderService = partyOrderService;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitPartyOrder(@Valid @RequestBody PartyOrderRequest request) {
        try {
            PartyOrder created = partyOrderService.submitPartyOrder(request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping
    public ResponseEntity<List<PartyOrder>> getAllPartyOrders(@RequestParam(required = false) Long outletId) {
        if (outletId != null) {
            return ResponseEntity.ok(partyOrderService.getPartyOrdersByOutlet(outletId));
        }
        return ResponseEntity.ok(partyOrderService.getAllPartyOrders());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @Valid @RequestBody PartyOrderStatusRequest request) {
        try {
            PartyOrder updated = partyOrderService.updatePartyOrderStatus(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
