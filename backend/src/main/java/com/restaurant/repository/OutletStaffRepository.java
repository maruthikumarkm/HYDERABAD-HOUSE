package com.restaurant.repository;

import com.restaurant.entity.OutletStaff;
import com.restaurant.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletStaffRepository extends JpaRepository<OutletStaff, Long> {
    Optional<OutletStaff> findByUserId(Long userId);
    List<OutletStaff> findByOutletId(Long outletId);

    @Query("SELECT os.user FROM OutletStaff os WHERE os.outlet.id = :outletId AND os.user.role.name = 'DELIVERY_STAFF' AND os.user.availabilityStatus = 'AVAILABLE'")
    List<User> findAvailableDeliveryStaffByOutletId(@Param("outletId") Long outletId);

    @Query("SELECT os.user FROM OutletStaff os WHERE os.outlet.id = :outletId AND os.user.role.name = 'DELIVERY_STAFF'")
    List<User> findAllDeliveryStaffByOutletId(@Param("outletId") Long outletId);
}
