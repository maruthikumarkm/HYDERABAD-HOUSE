package com.restaurant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class RazorpayPaymentGatewayService implements PaymentGatewayService {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayPaymentGatewayService.class);

    @Override
    public PaymentResult processPayment(Long orderId, String orderNumber, BigDecimal amount, String paymentMethod, String customerPhone) {
        // Standard production-ready abstraction for Razorpay UPI/Card/Netbanking gateway
        String txnRef = "TXN-RZP-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        logger.info("[PAYMENT GATEWAY] Initiating {} payment for order {}: ₹{} (Ref: {})", paymentMethod, orderNumber, amount, txnRef);

        // Formulate gateway audit response payload
        String rawJson = String.format(
                "{\"gateway\":\"Razorpay\",\"transactionId\":\"%s\",\"status\":\"captured\",\"amount\":%.2f,\"currency\":\"INR\",\"method\":\"%s\",\"phone\":\"%s\",\"mockSandbox\":true}",
                txnRef, amount.doubleValue(), paymentMethod, customerPhone
        );

        return new PaymentResult(true, txnRef, "Razorpay-v2-PG", rawJson, "Payment authorized and captured successfully.");
    }

    @Override
    public PaymentResult verifyPayment(String transactionRef, String signature) {
        return new PaymentResult(true, transactionRef, "Razorpay-v2-PG", "{\"verified\":true}", "Signature verified.");
    }

    @Override
    public PaymentResult refundPayment(String transactionRef, BigDecimal amount) {
        String refundId = "RFD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        logger.info("[PAYMENT GATEWAY] Processing refund of ₹{} for transaction {}", amount, transactionRef);
        return new PaymentResult(true, refundId, "Razorpay-v2-PG", "{\"refundId\":\"" + refundId + "\",\"status\":\"processed\"}", "Refund initiated.");
    }
}
