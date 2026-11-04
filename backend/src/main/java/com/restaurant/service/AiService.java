package com.restaurant.service;

import com.restaurant.dto.PrepTimePredictionRequest;
import com.restaurant.dto.PrepTimePredictionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiService {
    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    @Value("${app.ai.service-url:http://localhost:8000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public int predictPreparationTime(Long outletId, String primaryCategory, int totalQuantity, int itemCount, int pendingOrders) {
        String endpoint = aiServiceUrl + "/predict-prep-time";

        Map<String, Object> payload = new HashMap<>();
        payload.put("outlet_id", outletId);
        payload.put("menu_category", primaryCategory != null ? primaryCategory : "Chicken Biryani");
        payload.put("total_quantity", Math.max(1, totalQuantity));
        payload.put("item_count", Math.max(1, itemCount));
        payload.put("current_pending_orders", Math.max(0, pendingOrders));

        try {
            logger.info("Calling AI service at {} for prep time prediction", endpoint);
            ResponseEntity<PrepTimePredictionResponse> response = restTemplate.postForEntity(
                    endpoint, payload, PrepTimePredictionResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                int predicted = response.getBody().getPredictedPrepTimeMinutes();
                logger.info("AI predicted prep time: {} mins (model: {})", predicted, response.getBody().getModelUsed());
                return predicted;
            }
        } catch (RestClientException e) {
            logger.warn("AI service unreachable or failed ({}). Using safe algorithmic fallback.", e.getMessage());
        }

        // Safe Fallback estimation algorithm
        return calculateFallbackTime(primaryCategory, totalQuantity, pendingOrders);
    }

    public int calculateFallbackTime(String category, int totalQuantity, int pendingOrders) {
        int base = 18;
        if (category != null) {
            if (category.contains("Mutton")) base = 25;
            else if (category.contains("Chicken")) base = 20;
            else if (category.contains("Haleem")) base = 15;
            else if (category.contains("Veg")) base = 15;
            else if (category.contains("Dessert") || category.contains("Beverage")) base = 8;
        }

        int qtyFactor = Math.max(0, totalQuantity - 1) * 3;
        int queueFactor = pendingOrders * 2;
        return base + qtyFactor + queueFactor;
    }
}
