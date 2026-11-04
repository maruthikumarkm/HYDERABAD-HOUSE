package com.restaurant.controller;

import com.restaurant.entity.LoyaltyAccount;
import com.restaurant.entity.LoyaltyTransaction;
import com.restaurant.repository.LoyaltyAccountRepository;
import com.restaurant.repository.LoyaltyTransactionRepository;
import com.restaurant.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository transactionRepository;

    public LoyaltyController(LoyaltyAccountRepository loyaltyAccountRepository,
                             LoyaltyTransactionRepository transactionRepository) {
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/my-account")
    public ResponseEntity<?> getMyLoyaltyAccount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Optional<LoyaltyAccount> opt = loyaltyAccountRepository.findByUserId(userPrincipal.getId());
        if (opt.isEmpty()) {
            return ResponseEntity.ok(Map.of("pointsBalance", 0, "tier", "BRONZE", "lifetimePoints", 0));
        }

        LoyaltyAccount account = opt.get();
        List<LoyaltyTransaction> transactions = transactionRepository.findByAccountIdOrderByCreatedAtDesc(account.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("pointsBalance", account.getPointsBalance());
        res.put("lifetimePoints", account.getLifetimePointsEarned());
        res.put("tier", account.getTier());
        res.put("transactions", transactions);

        return ResponseEntity.ok(res);
    }
}
