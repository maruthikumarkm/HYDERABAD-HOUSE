package com.restaurant.repository;

import com.restaurant.entity.PartyOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PartyOrderRepository extends JpaRepository<PartyOrder, Long> {
    List<PartyOrder> findAllByOrderByCreatedAtDesc();
    List<PartyOrder> findByOutletIdOrderByCreatedAtDesc(Long outletId);
}
