package com.restaurant.dto;

import java.math.BigDecimal;

public class OutletOverrideRequest {
    private BigDecimal customPrice;
    private Boolean isAvailable;
    private Boolean isFeatured;

    public OutletOverrideRequest() {}

    public BigDecimal getCustomPrice() { return customPrice; }
    public void setCustomPrice(BigDecimal customPrice) { this.customPrice = customPrice; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }
}
