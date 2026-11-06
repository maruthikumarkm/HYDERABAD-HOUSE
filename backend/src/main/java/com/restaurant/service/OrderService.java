package com.restaurant.service;

import com.restaurant.dto.OrderCreateRequest;
import com.restaurant.dto.OrderItemRequest;
import com.restaurant.dto.OrderStatusUpdateRequest;
import com.restaurant.entity.*;
import com.restaurant.repository.*;
import com.restaurant.websocket.WebSocketService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final OutletRepository outletRepository;
    private final MenuItemRepository menuItemRepository;
    private final OutletMenuRepository outletMenuRepository;
    private final CouponRepository couponRepository;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final NotificationRepository notificationRepository;
    private final AiService aiService;
    private final WebSocketService webSocketService;
    private final AuditLogService auditLogService;
    private final PaymentGatewayService paymentGatewayService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        PaymentRepository paymentRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        OutletRepository outletRepository,
                        MenuItemRepository menuItemRepository,
                        OutletMenuRepository outletMenuRepository,
                        CouponRepository couponRepository,
                        LoyaltyAccountRepository loyaltyAccountRepository,
                        LoyaltyTransactionRepository loyaltyTransactionRepository,
                        NotificationRepository notificationRepository,
                        AiService aiService,
                        WebSocketService webSocketService,
                        AuditLogService auditLogService,
                        PaymentGatewayService paymentGatewayService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.outletRepository = outletRepository;
        this.menuItemRepository = menuItemRepository;
        this.outletMenuRepository = outletMenuRepository;
        this.couponRepository = couponRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.loyaltyTransactionRepository = loyaltyTransactionRepository;
        this.notificationRepository = notificationRepository;
        this.aiService = aiService;
        this.webSocketService = webSocketService;
        this.auditLogService = auditLogService;
        this.paymentGatewayService = paymentGatewayService;
    }

    @Transactional
    public Order createOrder(User customer, OrderCreateRequest request) {
        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new NoSuchElementException("Outlet not found with id: " + request.getOutletId()));

        if (!Boolean.TRUE.equals(outlet.getIsActive())) {
            throw new IllegalStateException("Selected outlet is currently inactive.");
        }

        // 1. Validate stock and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;
        String primaryCategory = "Chicken Biryani";

        List<OrderItem> preparedItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new NoSuchElementException("Menu item not found: " + itemReq.getMenuItemId()));

            // Outlet-specific stock check
            Optional<OutletMenu> om = outletMenuRepository.findByOutletIdAndMenuItemId(outlet.getId(), menuItem.getId());
            if (om.isPresent()) {
                if (!Boolean.TRUE.equals(om.get().getIsAvailable())) {
                    throw new IllegalStateException("Item '" + menuItem.getName() + "' is currently out of stock at " + outlet.getName());
                }
            }

            BigDecimal unitPrice = om.isPresent() && om.get().getCustomPrice() != null
                    ? om.get().getCustomPrice()
                    : menuItem.getBasePrice();

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            totalQuantity += itemReq.getQuantity();

            primaryCategory = menuItem.getCategory().getName();

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setItemName(menuItem.getName());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPortionSize(itemReq.getPortionSize() != null ? itemReq.getPortionSize() : menuItem.getPortionSize());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSpiceLevel(itemReq.getSpiceLevel() != null ? itemReq.getSpiceLevel() : menuItem.getSpiceLevel());
            orderItem.setSpecialInstructions(itemReq.getSpecialInstructions());
            orderItem.setAddOnsJson(itemReq.getAddOnsJson());
            orderItem.setTotalPrice(lineTotal);
            preparedItems.add(orderItem);
        }

        // Minimum order amount check
        if (subtotal.compareTo(outlet.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order amount for " + outlet.getName() + " is ₹" + outlet.getMinOrderAmount());
        }

        // 2. GST (5% included in Hyderabadi restaurant pricing or broken down)
        // GST = subtotal * 5 / 105
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("5.00"))
                .divide(new BigDecimal("105.00"), 2, RoundingMode.HALF_UP);

        // Delivery fee
        BigDecimal deliveryFee = "DELIVERY".equalsIgnoreCase(request.getOrderType())
                ? (subtotal.compareTo(new BigDecimal("499.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("40.00"))
                : BigDecimal.ZERO;

        // 3. Coupon discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            discountAmount = calculateCouponDiscount(request.getCouponCode().trim(), subtotal);
        }

        // 4. Loyalty points redemption (1 point = ₹1, max 50% of subtotal)
        BigDecimal loyaltyDiscount = BigDecimal.ZERO;
        if (request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
            loyaltyDiscount = redeemLoyaltyPoints(customer.getId(), request.getPointsToRedeem(), subtotal);
        }

        BigDecimal netTotal = subtotal.add(deliveryFee).subtract(discountAmount).subtract(loyaltyDiscount);
        if (netTotal.compareTo(BigDecimal.ZERO) < 0) {
            netTotal = BigDecimal.ZERO;
        }

        // 5. AI Preparation Time Prediction
        long pendingOrdersCount = orderRepository.countPendingOrdersByOutlet(outlet.getId());
        int aiPredictedPrepTime = aiService.predictPreparationTime(
                outlet.getId(),
                primaryCategory,
                totalQuantity,
                preparedItems.size(),
                (int) pendingOrdersCount
        );

        // Business Rule: promised prep time is maximum of AI prediction and outlet minimum prep time
        int promisedPrepTime = Math.max(aiPredictedPrepTime, outlet.getMinPrepTimeMinutes());

        // 6. Create Order Entity
        Order order = new Order();
        String orderNumber = "WEB-" + (100000 + new Random().nextInt(900000));
        order.setOrderNumber(orderNumber);
        order.setCustomer(customer);
        order.setOutlet(outlet);
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "DELIVERY");
        order.setStatus("PLACED");
        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setDeliveryFee(deliveryFee);
        order.setDiscountAmount(discountAmount);
        order.setLoyaltyDiscount(loyaltyDiscount);
        order.setTotalAmount(netTotal);
        order.setPaymentStatus("PAID"); // Mock payment is immediately successful
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "UPI");
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setCustomerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName());
        order.setCustomerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone() : customer.getPhone());
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setPromisedPrepTimeMinutes(promisedPrepTime);
        order.setPlacedAt(LocalDateTime.now());
        order.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(promisedPrepTime));

        for (OrderItem oi : preparedItems) {
            oi.setOrder(order);
        }
        order.setItems(preparedItems);

        Order savedOrder = orderRepository.save(order);

        // 7. Payment Record via PaymentGatewayService abstraction
        PaymentGatewayService.PaymentResult payResult = paymentGatewayService.processPayment(
                savedOrder.getId(), savedOrder.getOrderNumber(), netTotal, savedOrder.getPaymentMethod(), savedOrder.getCustomerPhone()
        );

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setTransactionRef(payResult.getTransactionRef());
        payment.setPaymentMethod(savedOrder.getPaymentMethod());
        payment.setAmount(netTotal);
        payment.setStatus(payResult.isSuccess() ? "SUCCESS" : "FAILED");
        payment.setGatewayResponse(payResult.getRawResponse());
        paymentRepository.save(payment);

        // 8. Order Status History
        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, "PLACED", "Order successfully placed via Hyderabad House Direct Platform", customer.getId()
        );
        statusHistoryRepository.save(history);

        // Audit Trail
        auditLogService.log(customer.getId(), customer.getName(), "CUSTOMER", "ORDER_PLACED", "ORDER",
                savedOrder.getOrderNumber(), "Placed order for ₹" + netTotal + " at " + outlet.getName());

        // 9. Award Loyalty Points (10% of order total earned as points)
        awardLoyaltyPoints(customer.getId(), savedOrder.getId(), netTotal);

        // 10. Notifications
        Notification notif = new Notification(
                customer.getId(),
                savedOrder.getId(),
                outlet.getId(),
                "Order Placed Successfully (" + savedOrder.getOrderNumber() + ")",
                "Your order has been routed to " + outlet.getName() + ". Estimated preparation: " + promisedPrepTime + " mins.",
                "ORDER_PLACED"
        );
        notificationRepository.save(notif);

        // 11. Broadcast Real-time WebSocket Event to Kitchen and Customer!
        Map<String, Object> wsPayload = buildOrderWebSocketPayload(savedOrder);
        webSocketService.sendToKitchen(outlet.getId(), wsPayload);
        webSocketService.sendToCustomer(savedOrder.getOrderNumber(), wsPayload);
        webSocketService.sendToOutletManager(outlet.getId(), wsPayload);
        webSocketService.sendToAdmin(wsPayload);

        return savedOrder;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatusUpdateRequest request, Long updatedByUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        String newStatus = request.getStatus().toUpperCase();
        order.setStatus(newStatus);

        LocalDateTime now = LocalDateTime.now();
        switch (newStatus) {
            case "CONFIRMED":
                order.setConfirmedAt(now);
                break;
            case "PREPARING":
                order.setPreparingAt(now);
                break;
            case "READY_FOR_PICKUP":
                order.setReadyAt(now);
                break;
            case "RIDER_HANDOFF":
                order.setHandedOffAt(now);
                break;
            case "COMPLETED":
                order.setCompletedAt(now);
                break;
            case "CANCELLED":
                order.setCancelledAt(now);
                break;
        }

        Order saved = orderRepository.save(order);

        // Record history
        OrderStatusHistory history = new OrderStatusHistory(
                saved, newStatus, request.getNotes() != null ? request.getNotes() : "Status updated to " + newStatus, updatedByUserId
        );
        statusHistoryRepository.save(history);

        // Audit log
        auditLogService.log(updatedByUserId, "Staff/System", "STAFF", "ORDER_STATUS_CHANGED", "ORDER",
                saved.getOrderNumber(), "Order transitioned to " + newStatus + (request.getNotes() != null ? " (" + request.getNotes() + ")" : ""));

        // Notification to customer
        Notification notif = new Notification(
                order.getCustomer().getId(),
                order.getId(),
                order.getOutlet().getId(),
                "Order Update: " + newStatus,
                "Your order " + order.getOrderNumber() + " is now " + newStatus.replace("_", " "),
                newStatus
        );
        notificationRepository.save(notif);

        // Real-time WebSocket update to both kitchen and customer!
        Map<String, Object> wsPayload = buildOrderWebSocketPayload(saved);
        webSocketService.sendToKitchen(saved.getOutlet().getId(), wsPayload);
        webSocketService.sendToCustomer(saved.getOrderNumber(), wsPayload);
        webSocketService.sendToOutletManager(saved.getOutlet().getId(), wsPayload);
        webSocketService.sendToAdmin(wsPayload);

        return saved;
    }

    public Order getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new NoSuchElementException("Order not found with number: " + orderNumber));
    }

    public List<Order> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerIdOrderByPlacedAtDesc(customerId);
    }

    public List<Order> getOrdersForKitchen(Long outletId) {
        List<String> activeStatuses = Arrays.asList("PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP");
        return orderRepository.findByOutletIdAndStatusInOrderByPlacedAtAsc(outletId, activeStatuses);
    }

    public List<Order> getAllOrdersForOutlet(Long outletId) {
        return orderRepository.findByOutletIdOrderByPlacedAtDesc(outletId);
    }

    public List<OrderStatusHistory> getOrderHistory(Long orderId) {
        return statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }

    /**
     * Periodic Late Order Check (every 30 seconds)
     * If an order is 10 minutes past promised time and still pending, alert manager & customer!
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void checkLateOrders() {
        List<Order> activeOrders = orderRepository.findActiveOrdersToCheckLate();
        LocalDateTime now = LocalDateTime.now();

        for (Order order : activeOrders) {
            if (order.getEstimatedReadyTime() != null && now.isAfter(order.getEstimatedReadyTime().plusMinutes(10))) {
                order.setIsLate(true);
                if (!Boolean.TRUE.equals(order.getLateAlertSent())) {
                    order.setLateAlertSent(true);
                    orderRepository.save(order);

                    // Alert Manager
                    Notification managerAlert = new Notification(
                            null,
                            order.getId(),
                            order.getOutlet().getId(),
                            "CRITICAL LATE ALERT: Order " + order.getOrderNumber(),
                            "Order " + order.getOrderNumber() + " is >10 mins overdue at " + order.getOutlet().getName() + ". Please expedite immediately.",
                            "LATE_ALERT"
                    );
                    notificationRepository.save(managerAlert);

                    // Alert Customer
                    Notification customerAlert = new Notification(
                            order.getCustomer().getId(),
                            order.getId(),
                            order.getOutlet().getId(),
                            "Order Preparation Delay Alert",
                            "Your order is taking slightly longer than promised due to special dum preparation. We are expediting it now.",
                            "LATE_ALERT"
                    );
                    notificationRepository.save(customerAlert);

                    // Broadcast WS Alert
                    Map<String, Object> wsPayload = buildOrderWebSocketPayload(order);
                    wsPayload.put("alertType", "LATE_ORDER");
                    webSocketService.sendToOutletManager(order.getOutlet().getId(), wsPayload);
                    webSocketService.sendToKitchen(order.getOutlet().getId(), wsPayload);
                    webSocketService.sendToCustomer(order.getOrderNumber(), wsPayload);
                }
            }
        }
    }

    private BigDecimal calculateCouponDiscount(String code, BigDecimal subtotal) {
        Optional<Coupon> couponOpt = couponRepository.findByCodeAndIsActiveTrue(code);
        if (couponOpt.isEmpty()) {
            return BigDecimal.ZERO;
        }

        Coupon coupon = couponOpt.get();
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidUntil())) {
            return BigDecimal.ZERO;
        }

        if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = subtotal.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        return discount;
    }

    private BigDecimal redeemLoyaltyPoints(Long userId, int pointsToRedeem, BigDecimal subtotal) {
        Optional<LoyaltyAccount> accountOpt = loyaltyAccountRepository.findByUserId(userId);
        if (accountOpt.isEmpty()) return BigDecimal.ZERO;

        LoyaltyAccount account = accountOpt.get();
        int available = account.getPointsBalance();
        int redeem = Math.min(pointsToRedeem, available);

        // Max 50% discount allowed via points
        BigDecimal maxAllowed = subtotal.divide(new BigDecimal("2.00"), 2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.valueOf(redeem);

        if (discount.compareTo(maxAllowed) > 0) {
            discount = maxAllowed;
            redeem = discount.intValue();
        }

        account.setPointsBalance(account.getPointsBalance() - redeem);
        loyaltyAccountRepository.save(account);

        LoyaltyTransaction txn = new LoyaltyTransaction();
        txn.setAccount(account);
        txn.setTransactionType("REDEEMED");
        txn.setPoints(redeem);
        txn.setDescription("Redeemed " + redeem + " points for direct order discount");
        loyaltyTransactionRepository.save(txn);

        return discount;
    }

    private void awardLoyaltyPoints(Long userId, Long orderId, BigDecimal amountPaid) {
        Optional<LoyaltyAccount> accountOpt = loyaltyAccountRepository.findByUserId(userId);
        if (accountOpt.isPresent()) {
            LoyaltyAccount account = accountOpt.get();
            int pointsEarned = amountPaid.multiply(new BigDecimal("0.10")).intValue();
            if (pointsEarned > 0) {
                account.setPointsBalance(account.getPointsBalance() + pointsEarned);
                account.setLifetimePointsEarned(account.getLifetimePointsEarned() + pointsEarned);

                // Tier progression
                if (account.getLifetimePointsEarned() >= 2000) account.setTier("PLATINUM");
                else if (account.getLifetimePointsEarned() >= 1000) account.setTier("GOLD");
                else if (account.getLifetimePointsEarned() >= 500) account.setTier("SILVER");

                loyaltyAccountRepository.save(account);

                LoyaltyTransaction txn = new LoyaltyTransaction();
                txn.setAccount(account);
                txn.setOrderId(orderId);
                txn.setTransactionType("EARNED");
                txn.setPoints(pointsEarned);
                txn.setDescription("Earned 10% loyalty reward points for order");
                loyaltyTransactionRepository.save(txn);
            }
        }
    }

    public Map<String, Object> buildOrderWebSocketPayload(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("outletId", order.getOutlet().getId());
        map.put("outletName", order.getOutlet().getName());
        map.put("status", order.getStatus());
        map.put("totalAmount", order.getTotalAmount());
        map.put("orderType", order.getOrderType());
        map.put("customerName", order.getCustomerName());
        map.put("customerPhone", order.getCustomerPhone());
        map.put("specialInstructions", order.getSpecialInstructions());
        map.put("promisedPrepTimeMinutes", order.getPromisedPrepTimeMinutes());
        map.put("estimatedReadyTime", order.getEstimatedReadyTime());
        map.put("placedAt", order.getPlacedAt());
        map.put("isLate", order.getIsLate());
        map.put("itemsCount", order.getItems().size());
        map.put("items", order.getItems());
        return map;
    }
}
