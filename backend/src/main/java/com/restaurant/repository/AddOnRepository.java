package com.restaurant.repository;

import com.restaurant.entity.AddOn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AddOnRepository extends JpaRepository<AddOn, Long> {
    List<AddOn> findByIsAvailableTrue();
    List<AddOn> findByMenuItemIdOrMenuItemIdIsNullAndIsAvailableTrue(Long menuItemId);
}
