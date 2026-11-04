package com.restaurant.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class PrepTimePredictionResponse {
    @JsonProperty("predicted_prep_time_minutes")
    private Integer predictedPrepTimeMinutes;

    @JsonProperty("model_used")
    private String modelUsed;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    private Map<String, Object> factors;

    public PrepTimePredictionResponse() {}

    public Integer getPredictedPrepTimeMinutes() { return predictedPrepTimeMinutes; }
    public void setPredictedPrepTimeMinutes(Integer predictedPrepTimeMinutes) { this.predictedPrepTimeMinutes = predictedPrepTimeMinutes; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public Map<String, Object> getFactors() { return factors; }
    public void setFactors(Map<String, Object> factors) { this.factors = factors; }
}
