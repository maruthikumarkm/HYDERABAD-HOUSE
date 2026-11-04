package com.restaurant.dto;

import java.util.Map;

public class PrepTimePredictionRequest {
    private Long outletId;
    private String menuCategory;
    private Integer totalQuantity;
    private Integer itemCount;
    private Integer currentPendingOrders;

    public PrepTimePredictionRequest() {}

    public PrepTimePredictionRequest(Long outletId, String menuCategory, Integer totalQuantity, Integer itemCount, Integer currentPendingOrders) {
        this.outletId = outletId;
        this.menuCategory = menuCategory;
        this.totalQuantity = totalQuantity;
        this.itemCount = itemCount;
        this.currentPendingOrders = currentPendingOrders;
    }

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getMenuCategory() { return menuCategory; }
    public void setMenuCategory(String menuCategory) { this.menuCategory = menuCategory; }

    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

    public Integer getItemCount() { return itemCount; }
    public void setItemCount(Integer itemCount) { this.itemCount = itemCount; }

    public Integer getCurrentPendingOrders() { return currentPendingOrders; }
    public void setCurrentPendingOrders(Integer currentPendingOrders) { this.currentPendingOrders = currentPendingOrders; }
}
