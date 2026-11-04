package com.restaurant.repository;

import com.restaurant.entity.PrepHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrepHistoryRepository extends JpaRepository<PrepHistory, Long> {
    List<PrepHistory> findByOutletId(Long outletId);
}
