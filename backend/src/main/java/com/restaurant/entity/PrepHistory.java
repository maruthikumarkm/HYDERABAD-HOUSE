package com.restaurant.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prep_history")
public class PrepHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "outlet_id", nullable = false)
    private Long outletId;

    @Column(name = "menu_category", nullable = false, length = 80)
    private String menuCategory;

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    @Column(name = "item_count", nullable = false)
    private Integer itemCount;

    @Column(name = "current_pending_orders", nullable = false)
    private Integer currentPendingOrders;

    @Column(name = "actual_prep_time_minutes", nullable = false)
    private Integer actualPrepTimeMinutes;

    @Column(name = "recorded_at", updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
    }

    public PrepHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Integer getActualPrepTimeMinutes() { return actualPrepTimeMinutes; }
    public void setActualPrepTimeMinutes(Integer actualPrepTimeMinutes) { this.actualPrepTimeMinutes = actualPrepTimeMinutes; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
