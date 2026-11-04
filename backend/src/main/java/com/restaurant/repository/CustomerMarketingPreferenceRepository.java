package com.restaurant.repository;

import com.restaurant.entity.CustomerMarketingPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerMarketingPreferenceRepository extends JpaRepository<CustomerMarketingPreference, Long> {
    Optional<CustomerMarketingPreference> findByUserId(Long userId);
}
