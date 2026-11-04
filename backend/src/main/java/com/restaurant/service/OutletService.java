package com.restaurant.service;

import com.restaurant.dto.WorkloadUpdateRequest;
import com.restaurant.entity.Outlet;
import com.restaurant.repository.OutletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class OutletService {

    private final OutletRepository outletRepository;

    public OutletService(OutletRepository outletRepository) {
        this.outletRepository = outletRepository;
    }

    public List<Outlet> getAllActiveOutlets() {
        return outletRepository.findByIsActiveTrue();
    }

    public Outlet getOutletById(Long id) {
        return outletRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Outlet not found with id: " + id));
    }

    @Transactional
    public Outlet updateWorkload(Long outletId, WorkloadUpdateRequest request) {
        Outlet outlet = getOutletById(outletId);
        outlet.setCurrentWorkloadLevel(request.getWorkloadLevel());
        if (request.getPrepTimeMinutes() != null && request.getPrepTimeMinutes() > 0) {
            outlet.setMinPrepTimeMinutes(request.getPrepTimeMinutes());
        }
        return outletRepository.save(outlet);
    }

    /**
     * Find nearest outlet using Haversine formula
     */
    public Map<String, Object> findNearestOutlet(double customerLat, double customerLon) {
        List<Outlet> outlets = outletRepository.findByIsActiveTrue();
        Outlet nearestOutlet = null;
        double minDistance = Double.MAX_VALUE;

        for (Outlet outlet : outlets) {
            double distance = calculateHaversineDistanceKm(
                    customerLat, customerLon,
                    outlet.getLatitude().doubleValue(),
                    outlet.getLongitude().doubleValue()
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestOutlet = outlet;
            }
        }

        Map<String, Object> result = new HashMap<>();
        if (nearestOutlet != null) {
            boolean isDeliverable = minDistance <= nearestOutlet.getDeliveryRadiusKm().doubleValue();
            result.put("outlet", nearestOutlet);
            result.put("distanceKm", Math.round(minDistance * 10.0) / 10.0);
            result.put("isDeliverable", isDeliverable);
            result.put("message", isDeliverable
                    ? "Great! " + nearestOutlet.getName() + " delivers to your location."
                    : "Nearest outlet is " + (Math.round(minDistance * 10.0) / 10.0) + " km away, which is outside delivery radius of " + nearestOutlet.getDeliveryRadiusKm() + " km. Available for Takeaway!");
        } else {
            result.put("message", "No active outlets available at this moment.");
        }
        return result;
    }

    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
