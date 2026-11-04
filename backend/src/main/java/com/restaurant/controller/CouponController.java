package com.restaurant.controller;

import com.restaurant.dto.CouponValidateRequest;
import com.restaurant.entity.Coupon;
import com.restaurant.repository.CouponRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    public ResponseEntity<List<Coupon>> getActiveCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@Valid @RequestBody CouponValidateRequest request) {
        Optional<Coupon> opt = couponRepository.findByCodeAndIsActiveTrue(request.getCode().trim().toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or inactive coupon code"));
        }

        Coupon coupon = opt.get();
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidUntil())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Coupon has expired"));
        }

        if (request.getSubtotal().compareTo(coupon.getMinOrderAmount()) < 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Minimum order amount of ₹" + coupon.getMinOrderAmount() + " required for this coupon"
            ));
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = request.getSubtotal().multiply(coupon.getDiscountValue()).divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        Map<String, Object> res = new HashMap<>();
        res.put("valid", true);
        res.put("code", coupon.getCode());
        res.put("description", coupon.getDescription());
        res.put("discountAmount", discount);
        return ResponseEntity.ok(res);
    }
}
