package com.restaurant.service;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;

public interface PaymentGatewayService {
    PaymentResult processPayment(Long orderId, String orderNumber, BigDecimal amount, String paymentMethod, String customerPhone);
    PaymentResult verifyPayment(String transactionRef, String signature);
    PaymentResult refundPayment(String transactionRef, BigDecimal amount);

    class PaymentResult {
        private final boolean success;
        private final String transactionRef;
        private final String gatewayName;
        private final String rawResponse;
        private final String message;

        public PaymentResult(boolean success, String transactionRef, String gatewayName, String rawResponse, String message) {
            this.success = success;
            this.transactionRef = transactionRef;
            this.gatewayName = gatewayName;
            this.rawResponse = rawResponse;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getTransactionRef() { return transactionRef; }
        public String getGatewayName() { return gatewayName; }
        public String getRawResponse() { return rawResponse; }
        public String getMessage() { return message; }
    }
}
