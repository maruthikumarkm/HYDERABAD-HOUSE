package com.restaurant.repository;

import com.restaurant.entity.PartyOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PartyOrderDetailRepository extends JpaRepository<PartyOrderDetail, Long> {
    Optional<PartyOrderDetail> findByOrderId(Long orderId);
}
