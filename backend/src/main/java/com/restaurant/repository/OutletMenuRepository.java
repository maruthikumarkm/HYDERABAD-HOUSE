package com.restaurant.repository;

import com.restaurant.entity.OutletMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutletMenuRepository extends JpaRepository<OutletMenu, Long> {
    List<OutletMenu> findByOutletId(Long outletId);
    Optional<OutletMenu> findByOutletIdAndMenuItemId(Long outletId, Long menuItemId);
}
