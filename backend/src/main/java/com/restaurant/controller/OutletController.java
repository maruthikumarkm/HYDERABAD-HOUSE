package com.restaurant.controller;

import com.restaurant.dto.WorkloadUpdateRequest;
import com.restaurant.entity.Outlet;
import com.restaurant.service.OutletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outlets")
public class OutletController {

    private final OutletService outletService;

    public OutletController(OutletService outletService) {
        this.outletService = outletService;
    }

    @GetMapping
    public ResponseEntity<List<Outlet>> getAllOutlets() {
        return ResponseEntity.ok(outletService.getAllActiveOutlets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Outlet> getOutletById(@PathVariable Long id) {
        return ResponseEntity.ok(outletService.getOutletById(id));
    }

    @PostMapping("/nearest")
    public ResponseEntity<Map<String, Object>> findNearestOutlet(@RequestBody Map<String, Double> coords) {
        Double lat = coords.get("latitude");
        Double lon = coords.get("longitude");
        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "latitude and longitude required"));
        }
        return ResponseEntity.ok(outletService.findNearestOutlet(lat, lon));
    }

    @PatchMapping("/{id}/workload")
    public ResponseEntity<Outlet> updateWorkload(@PathVariable Long id, @Valid @RequestBody WorkloadUpdateRequest request) {
        return ResponseEntity.ok(outletService.updateWorkload(id, request));
    }
}
