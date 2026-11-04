package com.restaurant.dto;

import jakarta.validation.constraints.NotBlank;

public class WorkloadUpdateRequest {
    @NotBlank(message = "Workload level is required")
    private String workloadLevel; // LOW, NORMAL, HIGH, CRITICAL

    private Integer prepTimeMinutes;

    public WorkloadUpdateRequest() {}

    public String getWorkloadLevel() { return workloadLevel; }
    public void setWorkloadLevel(String workloadLevel) { this.workloadLevel = workloadLevel; }

    public Integer getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(Integer prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }
}
