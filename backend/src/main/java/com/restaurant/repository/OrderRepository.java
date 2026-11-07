package com.restaurant.repository;

import com.restaurant.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByCustomerIdOrderByPlacedAtDesc(Long customerId);
    List<Order> findByOutletIdOrderByPlacedAtDesc(Long outletId);
    List<Order> findByOutletIdAndStatusInOrderByPlacedAtAsc(Long outletId, List<String> statuses);
    List<Order> findByStatusInOrderByPlacedAtAsc(List<String> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.outlet.id = :outletId AND o.status IN ('PLACED', 'CONFIRMED', 'PREPARING')")
    long countPendingOrdersByOutlet(@Param("outletId") Long outletId);

    @Query("SELECT o FROM Order o WHERE o.status IN ('PLACED', 'CONFIRMED', 'PREPARING') AND o.isLate = false")
    List<Order> findActiveOrdersToCheckLate();

    List<Order> findByPlacedAtBetweenOrderByPlacedAtDesc(LocalDateTime start, LocalDateTime end);

    List<Order> findByDeliveryStaffIdOrderByAssignedAtDesc(Long deliveryStaffId);
    List<Order> findByDeliveryStaffIdAndStatusInOrderByAssignedAtDesc(Long deliveryStaffId, List<String> statuses);
    List<Order> findByOrderTypeOrderByPlacedAtDesc(String orderType);
    List<Order> findByOutletIdAndOrderTypeOrderByPlacedAtDesc(Long outletId, String orderType);
}
