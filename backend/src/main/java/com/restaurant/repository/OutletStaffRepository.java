package com.restaurant.repository;

import com.restaurant.entity.OutletStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletStaffRepository extends JpaRepository<OutletStaff, Long> {
    Optional<OutletStaff> findByUserId(Long userId);
    List<OutletStaff> findByOutletId(Long outletId);
}
