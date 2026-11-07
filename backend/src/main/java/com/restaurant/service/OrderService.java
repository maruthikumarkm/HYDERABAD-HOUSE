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
    private final UserRepository userRepository;
    private final PartyOrderDetailRepository partyOrderDetailRepository;
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
                        UserRepository userRepository,
                        PartyOrderDetailRepository partyOrderDetailRepository,
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
        this.userRepository = userRepository;
        this.partyOrderDetailRepository = partyOrderDetailRepository;
        this.aiService = aiService;
        this.webSocketService = webSocketService;
        this.auditLogService = auditLogService;
        this.paymentGatewayService = paymentGatewayService;
    }

    public static class CalculatedOrder {
        public Outlet outlet;
        public List<OrderItem> preparedItems;
        public BigDecimal subtotal;
        public BigDecimal taxAmount;
        public BigDecimal deliveryFee;
        public BigDecimal discountAmount;
        public BigDecimal loyaltyDiscount;
        public BigDecimal netTotal;
        public int promisedPrepTime;
    }

    public CalculatedOrder calculateOrder(User customer, OrderCreateRequest request) {
        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new NoSuchElementException("Outlet not found with id: " + request.getOutletId()));

        if (!Boolean.TRUE.equals(outlet.getIsActive())) {
            throw new IllegalStateException("Selected outlet is currently inactive.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;
        String primaryCategory = "Chicken Biryani";

        List<OrderItem> preparedItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new NoSuchElementException("Menu item not found: " + itemReq.getMenuItemId()));

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

        if (subtotal.compareTo(outlet.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order amount for " + outlet.getName() + " is ₹" + outlet.getMinOrderAmount());
        }

        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("5.00"))
                .divide(new BigDecimal("105.00"), 2, RoundingMode.HALF_UP);

        BigDecimal deliveryFee = "DELIVERY".equalsIgnoreCase(request.getOrderType())
                ? (subtotal.compareTo(new BigDecimal("499.00")) >= 0 ? BigDecimal.ZERO : new BigDecimal("40.00"))
                : BigDecimal.ZERO;

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            discountAmount = calculateCouponDiscount(request.getCouponCode().trim(), subtotal);
        }

        BigDecimal loyaltyDiscount = BigDecimal.ZERO;
        if (request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
            loyaltyDiscount = redeemLoyaltyPoints(customer.getId(), request.getPointsToRedeem(), subtotal);
        }

        BigDecimal netTotal = subtotal.add(deliveryFee).subtract(discountAmount).subtract(loyaltyDiscount);
        if (netTotal.compareTo(BigDecimal.ZERO) < 0) {
            netTotal = BigDecimal.ZERO;
        }

        long pendingOrdersCount = orderRepository.countPendingOrdersByOutlet(outlet.getId());
        int aiPredictedPrepTime = aiService.predictPreparationTime(
                outlet.getId(),
                primaryCategory,
                totalQuantity,
                preparedItems.size(),
                (int) pendingOrdersCount
        );

        int promisedPrepTime = Math.max(aiPredictedPrepTime, outlet.getMinPrepTimeMinutes());

        CalculatedOrder co = new CalculatedOrder();
        co.outlet = outlet;
        co.preparedItems = preparedItems;
        co.subtotal = subtotal;
        co.taxAmount = taxAmount;
        co.deliveryFee = deliveryFee;
        co.discountAmount = discountAmount;
        co.loyaltyDiscount = loyaltyDiscount;
        co.netTotal = netTotal;
        co.promisedPrepTime = promisedPrepTime;
        return co;
    }

    public BigDecimal calculateOrderAmount(User customer, OrderCreateRequest request) {
        CalculatedOrder co = calculateOrder(customer, request);
        return co.netTotal;
    }

    @Transactional
    public Order createOrder(User customer, OrderCreateRequest request) {
        CalculatedOrder co = calculateOrder(customer, request);

        Order order = new Order();
        String orderNumber = "WEB-" + (100000 + new Random().nextInt(900000));
        order.setOrderNumber(orderNumber);
        order.setCustomer(customer);
        order.setOutlet(co.outlet);
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "DELIVERY");
        order.setStatus("PLACED");
        order.setSubtotal(co.subtotal);
        order.setTaxAmount(co.taxAmount);
        order.setDeliveryFee(co.deliveryFee);
        order.setDiscountAmount(co.discountAmount);
        order.setLoyaltyDiscount(co.loyaltyDiscount);
        order.setTotalAmount(co.netTotal);
        order.setPaymentStatus("PAID");
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "UPI");
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setCustomerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName());
        order.setCustomerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone() : customer.getPhone());
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setPromisedPrepTimeMinutes(co.promisedPrepTime);
        order.setPlacedAt(LocalDateTime.now());
        order.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(co.promisedPrepTime));

        for (OrderItem oi : co.preparedItems) {
            oi.setOrder(order);
        }
        order.setItems(co.preparedItems);

        if (Boolean.TRUE.equals(request.getIsPartyOrder())) {
            order.setOrderType("PARTY_BULK");
            PartyOrderDetail pod = new PartyOrderDetail();
            pod.setOrder(order);
            pod.setEventType(request.getEventType() != null ? request.getEventType() : "Party Feast");
            if (request.getEventDate() != null && !request.getEventDate().trim().isEmpty()) {
                try {
                    pod.setEventDate(java.time.LocalDate.parse(request.getEventDate()));
                } catch (Exception ex) {
                    pod.setEventDate(java.time.LocalDate.now().plusDays(2));
                }
            } else {
                pod.setEventDate(java.time.LocalDate.now().plusDays(2));
            }
            pod.setEventTime(request.getEventTime() != null ? request.getEventTime() : "19:30");
            pod.setGuestCount(request.getGuestCount() != null ? request.getGuestCount() : 25);
            pod.setContactName(order.getCustomerName());
            pod.setContactPhone(order.getCustomerPhone());
            pod.setDeliveryAddress(order.getDeliveryAddress());
            pod.setSpecialInstructions(order.getSpecialInstructions());
            order.setPartyDetails(pod);
        }

        Order savedOrder = orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setCustomerId(customer.getId());
        payment.setTransactionRef("TXN_" + System.currentTimeMillis() + "_" + (new Random().nextInt(9000) + 1000));
        payment.setPaymentMethod(savedOrder.getPaymentMethod());
        payment.setAmount(co.netTotal);
        payment.setStatus("SUCCESS");
        payment.setGatewayResponse("Direct payment processed");
        paymentRepository.save(payment);

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, "PLACED", "Order successfully placed via Hyderabad House Direct Platform", customer.getId()
        );
        statusHistoryRepository.save(history);

        auditLogService.log(customer.getId(), customer.getName(), "CUSTOMER", "ORDER_PLACED", "ORDER",
                savedOrder.getOrderNumber(), "Placed order for ₹" + co.netTotal + " at " + co.outlet.getName());

        awardLoyaltyPoints(customer.getId(), savedOrder.getId(), co.netTotal);

        Notification notif = new Notification(
                customer.getId(),
                savedOrder.getId(),
                co.outlet.getId(),
                "Order Placed Successfully (" + savedOrder.getOrderNumber() + ")",
                "Your order has been routed to " + co.outlet.getName() + ". Estimated preparation: " + co.promisedPrepTime + " mins.",
                "ORDER_PLACED"
        );
        notificationRepository.save(notif);

        Map<String, Object> wsPayload = buildOrderWebSocketPayload(savedOrder);
        webSocketService.sendToKitchen(co.outlet.getId(), wsPayload);
        webSocketService.sendToCustomer(savedOrder.getOrderNumber(), wsPayload);
        webSocketService.sendToOutletManager(co.outlet.getId(), wsPayload);
        webSocketService.sendToAdmin(wsPayload);

        return savedOrder;
    }

    @Transactional
    public Order confirmPhonePeOrder(Payment payment) {
        if (payment.getOrder() != null) {
            return payment.getOrder();
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            OrderCreateRequest request = mapper.readValue(payment.getOrderPayload(), OrderCreateRequest.class);
            User customer = userRepository.findById(payment.getCustomerId())
                    .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + payment.getCustomerId()));

            CalculatedOrder co = calculateOrder(customer, request);

            Order order = new Order();
            String orderNumber = "WEB-" + (100000 + new Random().nextInt(900000));
            order.setOrderNumber(orderNumber);
            order.setCustomer(customer);
            order.setOutlet(co.outlet);
            order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "DELIVERY");
            order.setStatus("PLACED");
            order.setSubtotal(co.subtotal);
            order.setTaxAmount(co.taxAmount);
            order.setDeliveryFee(co.deliveryFee);
            order.setDiscountAmount(co.discountAmount);
            order.setLoyaltyDiscount(co.loyaltyDiscount);
            order.setTotalAmount(co.netTotal);
            order.setPaymentStatus("PAID");
            order.setPaymentMethod("PHONEPE_UPI");
            order.setDeliveryAddress(request.getDeliveryAddress());
            order.setCustomerName(request.getCustomerName() != null ? request.getCustomerName() : customer.getName());
            order.setCustomerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone() : customer.getPhone());
            order.setSpecialInstructions(request.getSpecialInstructions());
            order.setPromisedPrepTimeMinutes(co.promisedPrepTime);
            order.setPlacedAt(LocalDateTime.now());
            order.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(co.promisedPrepTime));

            for (OrderItem oi : co.preparedItems) {
                oi.setOrder(order);
            }
            order.setItems(co.preparedItems);

            if (Boolean.TRUE.equals(request.getIsPartyOrder())) {
                order.setOrderType("PARTY_BULK");
                PartyOrderDetail pod = new PartyOrderDetail();
                pod.setOrder(order);
                pod.setEventType(request.getEventType() != null ? request.getEventType() : "Party Feast");
                if (request.getEventDate() != null && !request.getEventDate().trim().isEmpty()) {
                    try {
                        pod.setEventDate(java.time.LocalDate.parse(request.getEventDate()));
                    } catch (Exception ex) {
                        pod.setEventDate(java.time.LocalDate.now().plusDays(2));
                    }
                } else {
                    pod.setEventDate(java.time.LocalDate.now().plusDays(2));
                }
                pod.setEventTime(request.getEventTime() != null ? request.getEventTime() : "19:30");
                pod.setGuestCount(request.getGuestCount() != null ? request.getGuestCount() : 25);
                pod.setContactName(order.getCustomerName());
                pod.setContactPhone(order.getCustomerPhone());
                pod.setDeliveryAddress(order.getDeliveryAddress());
                pod.setSpecialInstructions(order.getSpecialInstructions());
                order.setPartyDetails(pod);
            }

            Order savedOrder = orderRepository.save(order);

            // Link payment to this order
            payment.setOrder(savedOrder);
            payment.setStatus("SUCCESS");
            paymentRepository.save(payment);

            // History
            OrderStatusHistory history = new OrderStatusHistory(
                    savedOrder, "PLACED", "Order verified and placed via PhonePe UPI Gateway", customer.getId()
            );
            statusHistoryRepository.save(history);

            // Audit
            auditLogService.log(customer.getId(), customer.getName(), "CUSTOMER", "PHONEPE_PAYMENT_VERIFIED", "ORDER",
                    savedOrder.getOrderNumber(), "PhonePe transaction " + payment.getMerchantTransactionId() + " verified. Order ₹" + co.netTotal);

            // Award loyalty points
            awardLoyaltyPoints(customer.getId(), savedOrder.getId(), co.netTotal);

            // Notification
            Notification notif = new Notification(
                    customer.getId(),
                    savedOrder.getId(),
                    co.outlet.getId(),
                    "Order Placed Successfully (" + savedOrder.getOrderNumber() + ")",
                    "Your PhonePe UPI payment was verified. Routed to " + co.outlet.getName() + ".",
                    "ORDER_PLACED"
            );
            notificationRepository.save(notif);

            // Real-time WebSocket to kitchen, customer, manager, admin
            Map<String, Object> wsPayload = buildOrderWebSocketPayload(savedOrder);
            webSocketService.sendToKitchen(co.outlet.getId(), wsPayload);
            webSocketService.sendToCustomer(savedOrder.getOrderNumber(), wsPayload);
            webSocketService.sendToOutletManager(co.outlet.getId(), wsPayload);
            webSocketService.sendToAdmin(wsPayload);

            return savedOrder;
        } catch (Exception e) {
            logger.error("Error confirming PhonePe order: ", e);
            throw new RuntimeException("Failed to confirm PhonePe order: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatusUpdateRequest request, Long updatedByUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        String newStatus = request.getStatus().toUpperCase();
        if ("READY".equals(newStatus)) {
            newStatus = "READY_FOR_PICKUP";
        }
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
            case "ASSIGNED":
                order.setAssignedAt(now);
                break;
            case "ACCEPTED":
                break;
            case "PICKED_UP":
                order.setPickedUpAt(now);
                break;
            case "OUT_FOR_DELIVERY":
                order.setOutForDeliveryAt(now);
                break;
            case "DELIVERED":
            case "COMPLETED":
                order.setDeliveredAt(now);
                order.setCompletedAt(now);
                if (order.getDeliveryStaff() != null) {
                    User staff = order.getDeliveryStaff();
                    staff.setAvailabilityStatus("AVAILABLE");
                    userRepository.save(staff);
                }
                break;
            case "RIDER_HANDOFF":
                order.setHandedOffAt(now);
                break;
            case "CANCELLED":
                order.setCancelledAt(now);
                if (order.getDeliveryStaff() != null) {
                    User staff = order.getDeliveryStaff();
                    staff.setAvailabilityStatus("AVAILABLE");
                    userRepository.save(staff);
                }
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

    @Transactional
    public Order assignDeliveryStaff(Long orderId, Long deliveryStaffId, Long managerUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        User deliveryStaff = userRepository.findById(deliveryStaffId)
                .orElseThrow(() -> new NoSuchElementException("Delivery staff user not found with id: " + deliveryStaffId));

        if (!"DELIVERY_STAFF".equalsIgnoreCase(deliveryStaff.getRole().getName())) {
            throw new IllegalArgumentException("Selected user is not a delivery staff member");
        }

        order.setStatus("ASSIGNED");
        order.setDeliveryStaff(deliveryStaff);
        order.setAssignedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        deliveryStaff.setAvailabilityStatus("BUSY");
        userRepository.save(deliveryStaff);

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, "ASSIGNED", "Assigned to delivery partner " + deliveryStaff.getName() + " (" + deliveryStaff.getPhone() + ")", managerUserId
        );
        statusHistoryRepository.save(history);

        auditLogService.log(managerUserId, "Outlet Manager", "OUTLET_MANAGER", "DELIVERY_ASSIGNED", "ORDER",
                savedOrder.getOrderNumber(), "Assigned to " + deliveryStaff.getName());

        Notification notif = new Notification(
                savedOrder.getCustomer().getId(),
                savedOrder.getId(),
                savedOrder.getOutlet().getId(),
                "Delivery Partner Assigned (" + savedOrder.getOrderNumber() + ")",
                deliveryStaff.getName() + " has been assigned to deliver your royal feast.",
                "ASSIGNED"
        );
        notificationRepository.save(notif);

        Notification staffNotif = new Notification(
                deliveryStaff.getId(),
                savedOrder.getId(),
                savedOrder.getOutlet().getId(),
                "New Order Assigned (" + savedOrder.getOrderNumber() + ")",
                "Order is ready for pickup at " + savedOrder.getOutlet().getName(),
                "ASSIGNED"
        );
        notificationRepository.save(staffNotif);

        Map<String, Object> wsPayload = buildOrderWebSocketPayload(savedOrder);
        webSocketService.sendToDelivery(deliveryStaff.getId(), wsPayload);
        webSocketService.sendToCustomer(savedOrder.getOrderNumber(), wsPayload);
        webSocketService.sendToKitchen(savedOrder.getOutlet().getId(), wsPayload);
        webSocketService.sendToOutletManager(savedOrder.getOutlet().getId(), wsPayload);
        webSocketService.sendToAdmin(wsPayload);

        return savedOrder;
    }

    @Transactional
    public Order updateDeliveryStatus(Long orderId, String nextStatus, Long deliveryStaffUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found with id: " + orderId));

        if (order.getDeliveryStaff() == null || !order.getDeliveryStaff().getId().equals(deliveryStaffUserId)) {
            User caller = userRepository.findById(deliveryStaffUserId).orElse(null);
            boolean isManagerOrAdmin = caller != null && (
                    "OUTLET_MANAGER".equalsIgnoreCase(caller.getRole().getName()) ||
                    "CENTRAL_ADMIN".equalsIgnoreCase(caller.getRole().getName())
            );
            if (!isManagerOrAdmin) {
                throw new IllegalStateException("You are not the assigned delivery partner for this order");
            }
        }

        String current = order.getStatus();
        String target = nextStatus.toUpperCase();

        LocalDateTime now = LocalDateTime.now();

        if ("ACCEPTED".equals(target)) {
            if (!"ASSIGNED".equals(current)) {
                throw new IllegalStateException("Order can only be accepted when status is ASSIGNED (current: " + current + ")");
            }
            order.setStatus("ACCEPTED");
        } else if ("PICKED_UP".equals(target)) {
            if (!"ACCEPTED".equals(current) && !"ASSIGNED".equals(current)) {
                throw new IllegalStateException("Order must be ACCEPTED before pickup (current: " + current + ")");
            }
            order.setStatus("PICKED_UP");
            order.setPickedUpAt(now);
        } else if ("OUT_FOR_DELIVERY".equals(target)) {
            if (!"PICKED_UP".equals(current)) {
                throw new IllegalStateException("Order must be PICKED_UP before OUT_FOR_DELIVERY (current: " + current + ")");
            }
            order.setStatus("OUT_FOR_DELIVERY");
            order.setOutForDeliveryAt(now);
        } else if ("DELIVERED".equals(target)) {
            if (!"OUT_FOR_DELIVERY".equals(current) && !"PICKED_UP".equals(current)) {
                throw new IllegalStateException("Order must be OUT_FOR_DELIVERY before DELIVERED (current: " + current + ")");
            }
            order.setStatus("DELIVERED");
            order.setDeliveredAt(now);
            order.setCompletedAt(now);

            if (order.getDeliveryStaff() != null) {
                User staff = order.getDeliveryStaff();
                staff.setAvailabilityStatus("AVAILABLE");
                userRepository.save(staff);
            }
        } else {
            throw new IllegalArgumentException("Unsupported delivery status: " + target);
        }

        Order savedOrder = orderRepository.save(order);

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder, target, "Delivery status updated to " + target, deliveryStaffUserId
        );
        statusHistoryRepository.save(history);

        auditLogService.log(deliveryStaffUserId, "Delivery Staff", "DELIVERY_STAFF", "DELIVERY_STATUS_CHANGED", "ORDER",
                savedOrder.getOrderNumber(), "Order transitioned to " + target);

        Notification notif = new Notification(
                savedOrder.getCustomer().getId(),
                savedOrder.getId(),
                savedOrder.getOutlet().getId(),
                "Delivery Update: " + target.replace("_", " "),
                "Your order " + savedOrder.getOrderNumber() + " is now " + target.replace("_", " "),
                target
        );
        notificationRepository.save(notif);

        Map<String, Object> wsPayload = buildOrderWebSocketPayload(savedOrder);
        if (savedOrder.getDeliveryStaff() != null) {
            webSocketService.sendToDelivery(savedOrder.getDeliveryStaff().getId(), wsPayload);
        }
        webSocketService.sendToCustomer(savedOrder.getOrderNumber(), wsPayload);
        webSocketService.sendToKitchen(savedOrder.getOutlet().getId(), wsPayload);
        webSocketService.sendToOutletManager(savedOrder.getOutlet().getId(), wsPayload);
        webSocketService.sendToAdmin(wsPayload);

        return savedOrder;
    }

    public List<Order> getOrdersForDeliveryStaff(Long deliveryStaffId) {
        return orderRepository.findByDeliveryStaffIdOrderByAssignedAtDesc(deliveryStaffId);
    }

    public List<Order> getPartyOrdersForKitchen(Long outletId) {
        if (outletId != null) {
            return orderRepository.findByOutletIdAndOrderTypeOrderByPlacedAtDesc(outletId, "PARTY_BULK");
        }
        return orderRepository.findByOrderTypeOrderByPlacedAtDesc("PARTY_BULK");
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
        map.put("deliveryAddress", order.getDeliveryAddress());
        map.put("specialInstructions", order.getSpecialInstructions());
        map.put("promisedPrepTimeMinutes", order.getPromisedPrepTimeMinutes());
        map.put("estimatedReadyTime", order.getEstimatedReadyTime());
        map.put("placedAt", order.getPlacedAt());
        map.put("assignedAt", order.getAssignedAt());
        map.put("pickedUpAt", order.getPickedUpAt());
        map.put("outForDeliveryAt", order.getOutForDeliveryAt());
        map.put("deliveredAt", order.getDeliveredAt());
        map.put("isLate", order.getIsLate());
        map.put("itemsCount", order.getItems() != null ? order.getItems().size() : 0);
        map.put("items", order.getItems());
        if (order.getDeliveryStaff() != null) {
            Map<String, Object> staffMap = new HashMap<>();
            staffMap.put("id", order.getDeliveryStaff().getId());
            staffMap.put("name", order.getDeliveryStaff().getName());
            staffMap.put("phone", order.getDeliveryStaff().getPhone());
            staffMap.put("availabilityStatus", order.getDeliveryStaff().getAvailabilityStatus());
            map.put("deliveryStaff", staffMap);
        }
        if (order.getPartyDetails() != null) {
            Map<String, Object> partyMap = new HashMap<>();
            partyMap.put("eventType", order.getPartyDetails().getEventType());
            partyMap.put("eventDate", order.getPartyDetails().getEventDate());
            partyMap.put("eventTime", order.getPartyDetails().getEventTime());
            partyMap.put("guestCount", order.getPartyDetails().getGuestCount());
            partyMap.put("contactName", order.getPartyDetails().getContactName());
            partyMap.put("contactPhone", order.getPartyDetails().getContactPhone());
            partyMap.put("deliveryAddress", order.getPartyDetails().getDeliveryAddress());
            partyMap.put("specialInstructions", order.getPartyDetails().getSpecialInstructions());
            map.put("partyDetails", partyMap);
        }
        return map;
    }
}
