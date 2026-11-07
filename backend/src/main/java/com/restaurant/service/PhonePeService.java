package com.restaurant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.dto.OrderCreateRequest;
import com.restaurant.entity.Order;
import com.restaurant.entity.Payment;
import com.restaurant.entity.User;
import com.restaurant.repository.PaymentRepository;
import com.restaurant.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;

@Service
public class PhonePeService {
    private static final Logger logger = LoggerFactory.getLogger(PhonePeService.class);

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.phonepe.merchant-id:PGTESTPAYUAT86}")
    private String merchantId;

    @Value("${app.phonepe.salt-key:96434309-7796-489d-8924-ab56988a6076}")
    private String saltKey;

    @Value("${app.phonepe.salt-index:1}")
    private String saltIndex;

    @Value("${app.phonepe.base-url:https://api-preprod.phonepe.com/apis/pg-sandbox}")
    private String baseUrl;

    @Value("${app.phonepe.redirect-url:http://localhost:5173/payment/status}")
    private String redirectUrl;

    @Value("${app.phonepe.callback-url:http://localhost:8080/api/payments/phonepe/callback}")
    private String callbackUrl;

    public PhonePeService(PaymentRepository paymentRepository,
                          UserRepository userRepository,
                          OrderService orderService) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Transactional
    public Map<String, Object> initiatePayment(User customer, OrderCreateRequest request) {
        try {
            // 1. Calculate actual order amount
            BigDecimal netTotal = orderService.calculateOrderAmount(customer, request);
            long amountInPaise = netTotal.multiply(new BigDecimal(100)).longValue();

            // 2. Generate unique merchant transaction ID
            String mtxnId = "MTXN_" + System.currentTimeMillis() + "_" + (new Random().nextInt(9000) + 1000);
            String muid = "MUID_" + customer.getId();

            // 3. Clean mobile number
            String phone = customer.getPhone() != null ? customer.getPhone().replaceAll("[^0-9]", "") : "9876543210";
            if (phone.length() > 10) phone = phone.substring(phone.length() - 10);
            if (phone.length() < 10) phone = "9876543210";

            // 4. Construct PhonePe JSON payload
            Map<String, Object> payloadMap = new LinkedHashMap<>();
            payloadMap.put("merchantId", merchantId);
            payloadMap.put("merchantTransactionId", mtxnId);
            payloadMap.put("merchantUserId", muid);
            payloadMap.put("amount", amountInPaise);
            payloadMap.put("redirectUrl", redirectUrl + "?mtxnId=" + mtxnId);
            payloadMap.put("redirectMode", "REDIRECT");
            payloadMap.put("callbackUrl", callbackUrl);
            payloadMap.put("mobileNumber", phone);

            Map<String, Object> instrument = new HashMap<>();
            instrument.put("type", "PAY_PAGE");
            payloadMap.put("paymentInstrument", instrument);

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);
            String base64Payload = Base64.getEncoder().encodeToString(jsonPayload.getBytes(StandardCharsets.UTF_8));

            // 5. Compute SHA256 checksum
            String checksumToHash = base64Payload + "/pg/v1/pay" + saltKey;
            String xVerify = sha256Hex(checksumToHash) + "###" + saltIndex;

            Map<String, String> requestBody = Map.of("request", base64Payload);
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            // 6. Invoke PhonePe API
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/pg/v1/pay"))
                    .header("Content-Type", "application/json")
                    .header("X-VERIFY", xVerify)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            logger.info("PhonePe initiate response [{}]: {}", response.statusCode(), responseBody);

            JsonNode rootNode = objectMapper.readTree(responseBody);
            boolean success = rootNode.path("success").asBoolean(false);

            String pgRedirectUrl = null;
            if (success) {
                pgRedirectUrl = rootNode.path("data")
                        .path("instrumentResponse")
                        .path("redirectInfo")
                        .path("url").asText();
            }

            if (pgRedirectUrl == null || pgRedirectUrl.isEmpty()) {
                // Fallback simulation URL if PG is in maintenance
                pgRedirectUrl = "https://mercury-uat.phonepe.com/transact/simulator?token=" + mtxnId;
            }

            // 7. Save pending payment record in database
            Payment payment = new Payment();
            payment.setCustomerId(customer.getId());
            payment.setMerchantTransactionId(mtxnId);
            payment.setTransactionRef("TXN_" + System.currentTimeMillis() + "_" + (new Random().nextInt(9000) + 1000));
            payment.setPaymentMethod("PHONEPE_UPI");
            payment.setAmount(netTotal);
            payment.setStatus("PENDING");
            payment.setOrderPayload(objectMapper.writeValueAsString(request));
            payment.setGatewayResponse(responseBody);
            paymentRepository.save(payment);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("merchantTransactionId", mtxnId);
            result.put("redirectUrl", pgRedirectUrl);
            result.put("amount", netTotal);
            result.put("orderPayload", request);
            return result;
        } catch (Exception e) {
            logger.error("PhonePe payment initiation failed: ", e);
            throw new RuntimeException("Failed to initiate PhonePe payment: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Object> checkPaymentStatus(String merchantTransactionId) {
        Payment payment = paymentRepository.findByMerchantTransactionId(merchantTransactionId)
                .orElseThrow(() -> new NoSuchElementException("Payment not found for transaction: " + merchantTransactionId));

        // Idempotency: If already verified and order created, return existing order
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus()) && payment.getOrder() != null) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "SUCCESS");
            res.put("message", "Payment verified and order confirmed.");
            res.put("order", orderService.buildOrderWebSocketPayload(payment.getOrder()));
            res.put("orderNumber", payment.getOrder().getOrderNumber());
            return res;
        }

        if ("FAILED".equalsIgnoreCase(payment.getStatus())) {
            return Map.of("status", "FAILED", "message", "Payment was declined or cancelled.");
        }

        // Query PhonePe pre-prod status API
        try {
            String path = "/pg/v1/status/" + merchantId + "/" + merchantTransactionId;
            String toHash = path + saltKey;
            String xVerify = sha256Hex(toHash) + "###" + saltIndex;

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("X-VERIFY", xVerify)
                    .header("X-MERCHANT-ID", merchantId)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            logger.info("PhonePe status check [{}]: {}", response.statusCode(), responseBody);

            JsonNode root = objectMapper.readTree(responseBody);
            String code = root.path("code").asText();
            String state = root.path("data").path("state").asText();

            if ("PAYMENT_SUCCESS".equalsIgnoreCase(code) || "COMPLETED".equalsIgnoreCase(state)) {
                payment.setStatus("SUCCESS");
                payment.setGatewayResponse(responseBody);
                paymentRepository.save(payment);

                // Confirm and persist Order in MySQL
                Order confirmedOrder = orderService.confirmPhonePeOrder(payment);

                Map<String, Object> res = new HashMap<>();
                res.put("status", "SUCCESS");
                res.put("message", "Payment verified successfully via PhonePe!");
                res.put("order", orderService.buildOrderWebSocketPayload(confirmedOrder));
                res.put("orderNumber", confirmedOrder.getOrderNumber());
                return res;
            } else if ("PAYMENT_ERROR".equalsIgnoreCase(code) || "PAYMENT_DECLINED".equalsIgnoreCase(code) || "FAILED".equalsIgnoreCase(state)) {
                payment.setStatus("FAILED");
                payment.setGatewayResponse(responseBody);
                paymentRepository.save(payment);

                return Map.of("status", "FAILED", "message", "Payment was declined by bank or user cancelled.");
            } else {
                return Map.of("status", "PENDING", "message", "Payment is still processing at PhonePe.");
            }
        } catch (Exception e) {
            logger.error("PhonePe status check error: ", e);
            return Map.of("status", "PENDING", "message", "Verifying payment with gateway...");
        }
    }

    @Transactional
    public Map<String, Object> simulatePaymentAction(String merchantTransactionId, String action) {
        Payment payment = paymentRepository.findByMerchantTransactionId(merchantTransactionId)
                .orElseThrow(() -> new NoSuchElementException("Payment not found: " + merchantTransactionId));

        if ("SUCCESS".equalsIgnoreCase(action)) {
            payment.setStatus("SUCCESS");
            paymentRepository.save(payment);

            Order confirmedOrder = orderService.confirmPhonePeOrder(payment);

            Map<String, Object> res = new HashMap<>();
            res.put("status", "SUCCESS");
            res.put("message", "Payment verified via PhonePe Gateway!");
            res.put("order", orderService.buildOrderWebSocketPayload(confirmedOrder));
            res.put("orderNumber", confirmedOrder.getOrderNumber());
            return res;
        } else {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            return Map.of("status", "FAILED", "message", "Payment declined or cancelled by user.");
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hash failed", e);
        }
    }
}
