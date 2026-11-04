package com.restaurant.controller;

import com.restaurant.dto.OrderCreateRequest;
import com.restaurant.entity.Order;
import com.restaurant.entity.OrderStatusHistory;
import com.restaurant.entity.User;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.UserPrincipal;
import com.restaurant.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                         @Valid @RequestBody OrderCreateRequest request) {
        try {
            User customer = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

            Order created = orderService.createOrder(customer, request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<?> getOrderByNumber(@PathVariable String orderNumber) {
        try {
            Order order = orderService.getOrderByNumber(orderNumber);
            List<OrderStatusHistory> history = orderService.getOrderHistory(order.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("order", order);
            response.put("history", history);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(userPrincipal.getId()));
    }
}
