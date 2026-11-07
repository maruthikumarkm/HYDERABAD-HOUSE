package com.restaurant.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class OrderCreateRequest {
    @NotNull(message = "Outlet ID is required")
    private Long outletId;

    private String orderType = "DELIVERY"; // DELIVERY, PICKUP
    private String deliveryAddress;
    private String customerName;
    private String customerPhone;
    private String specialInstructions;

    private String couponCode;
    private Integer pointsToRedeem = 0;

    private String paymentMethod = "UPI"; // UPI, CARD, CASH

    // Party / Bulk Order Details
    private Boolean isPartyOrder = false;
    private String eventType = "Party Feast";
    private String eventDate;
    private String eventTime = "19:30";
    private Integer guestCount;

    @NotEmpty(message = "Cart cannot be empty")
    private List<OrderItemRequest> items;

    public OrderCreateRequest() {}

    public Long getOutletId() { return outletId; }
    public void setOutletId(Long outletId) { this.outletId = outletId; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public Integer getPointsToRedeem() { return pointsToRedeem; }
    public void setPointsToRedeem(Integer pointsToRedeem) { this.pointsToRedeem = pointsToRedeem; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Boolean getIsPartyOrder() { return isPartyOrder; }
    public void setIsPartyOrder(Boolean isPartyOrder) { this.isPartyOrder = isPartyOrder; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getEventTime() { return eventTime; }
    public void setEventTime(String eventTime) { this.eventTime = eventTime; }

    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
