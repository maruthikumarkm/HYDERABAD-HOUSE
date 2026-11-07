package com.restaurant.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendToKitchen(Long outletId, Object payload) {
        String destination = "/topic/kitchen/" + outletId;
        logger.info("Broadcasting to kitchen destination: {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    public void sendToCustomer(String orderNumber, Object payload) {
        String destination = "/topic/orders/" + orderNumber;
        logger.info("Broadcasting to customer order destination: {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    public void sendToOutletManager(Long outletId, Object payload) {
        String destination = "/topic/manager/" + outletId;
        logger.info("Broadcasting to manager destination: {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    public void sendToAdmin(Object payload) {
        logger.info("Broadcasting to admin destination: /topic/admin");
        messagingTemplate.convertAndSend("/topic/admin", payload);
    }

    public void sendToDelivery(Long deliveryStaffId, Object payload) {
        String destination = "/topic/delivery/" + deliveryStaffId;
        logger.info("Broadcasting to delivery staff destination: {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }
}
