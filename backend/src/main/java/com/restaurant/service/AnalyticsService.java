package com.restaurant.service;

import com.restaurant.entity.Order;
import com.restaurant.entity.OrderItem;
import com.restaurant.entity.Outlet;
import com.restaurant.repository.OrderItemRepository;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.OutletRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OutletRepository outletRepository;

    public AnalyticsService(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            OutletRepository outletRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.outletRepository = outletRepository;
    }

    public Map<String, Object> getManagementAnalytics() {
        List<Order> allOrders = orderRepository.findAll();
        List<Outlet> allOutlets = outletRepository.findAll();
        List<OrderItem> allItems = orderItemRepository.findAll();

        int totalOrders = allOrders.size();
        BigDecimal totalSales = BigDecimal.ZERO;
        int cancelledCount = 0;
        int completedCount = 0;
        int totalPrepMinutes = 0;
        int prepOrdersCount = 0;

        Map<Long, Integer> outletOrderCounts = new HashMap<>();
        Map<Long, BigDecimal> outletSales = new HashMap<>();
        Map<String, Integer> paymentBreakdown = new HashMap<>();
        Map<String, BigDecimal> dailySales = new TreeMap<>();
        Map<Long, Integer> customerOrderFrequency = new HashMap<>();

        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("MMM dd");

        for (Order o : allOrders) {
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                totalSales = totalSales.add(o.getTotalAmount());
            } else {
                cancelledCount++;
            }

            if ("COMPLETED".equalsIgnoreCase(o.getStatus())) {
                completedCount++;
            }

            if (o.getPromisedPrepTimeMinutes() != null && o.getPromisedPrepTimeMinutes() > 0) {
                totalPrepMinutes += o.getPromisedPrepTimeMinutes();
                prepOrdersCount++;
            }

            // Outlet stats
            Long oId = o.getOutlet().getId();
            outletOrderCounts.put(oId, outletOrderCounts.getOrDefault(oId, 0) + 1);
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                outletSales.put(oId, outletSales.getOrDefault(oId, BigDecimal.ZERO).add(o.getTotalAmount()));
            }

            // Payment method
            String pm = o.getPaymentMethod() != null ? o.getPaymentMethod() : "UPI";
            paymentBreakdown.put(pm, paymentBreakdown.getOrDefault(pm, 0) + 1);

            // Daily sales
            String dayKey = o.getPlacedAt().format(dayFormatter);
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                dailySales.put(dayKey, dailySales.getOrDefault(dayKey, BigDecimal.ZERO).add(o.getTotalAmount()));
            }

            // Customer repeat count
            Long custId = o.getCustomer().getId();
            customerOrderFrequency.put(custId, customerOrderFrequency.getOrDefault(custId, 0) + 1);
        }

        long repeatCustomers = customerOrderFrequency.values().stream().filter(count -> count > 1).count();
        double avgPrepTime = prepOrdersCount > 0 ? (double) totalPrepMinutes / prepOrdersCount : 25.0;

        // Outlet performance breakdown
        List<Map<String, Object>> outletPerformance = new ArrayList<>();
        for (Outlet outlet : allOutlets) {
            int orders = outletOrderCounts.getOrDefault(outlet.getId(), 0);
            BigDecimal sales = outletSales.getOrDefault(outlet.getId(), BigDecimal.ZERO);
            if (orders > 0 || outlet.getId() <= 6) { // top outlets
                Map<String, Object> outMap = new HashMap<>();
                outMap.put("outletId", outlet.getId());
                outMap.put("outletName", outlet.getName().replace("Hyderabad House - ", ""));
                outMap.put("orders", orders);
                outMap.put("sales", sales);
                outletPerformance.add(outMap);
            }
        }

        // Popular food items
        Map<String, Integer> itemCounts = new HashMap<>();
        Map<String, BigDecimal> itemRevenues = new HashMap<>();
        for (OrderItem oi : allItems) {
            String name = oi.getItemName();
            itemCounts.put(name, itemCounts.getOrDefault(name, 0) + oi.getQuantity());
            itemRevenues.put(name, itemRevenues.getOrDefault(name, BigDecimal.ZERO).add(oi.getTotalPrice()));
        }

        List<Map<String, Object>> popularItems = itemCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", e.getKey());
                    m.put("quantitySold", e.getValue());
                    m.put("revenue", itemRevenues.getOrDefault(e.getKey(), BigDecimal.ZERO));
                    return m;
                })
                .collect(Collectors.toList());

        // Daily sales chart data
        List<Map<String, Object>> dailySalesList = new ArrayList<>();
        dailySales.forEach((date, amount) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("date", date);
            m.put("sales", amount);
            dailySalesList.add(m);
        });

        // Payment breakdown list for PieChart
        List<Map<String, Object>> paymentList = new ArrayList<>();
        paymentBreakdown.forEach((method, count) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("method", method);
            m.put("count", count);
            paymentList.add(m);
        });

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalOrders", totalOrders);
        analytics.put("totalSales", totalSales);
        analytics.put("completedOrders", completedCount);
        analytics.put("cancelledOrders", cancelledCount);
        analytics.put("repeatCustomers", repeatCustomers);
        analytics.put("avgPrepTimeMinutes", Math.round(avgPrepTime * 10.0) / 10.0);
        analytics.put("outletPerformance", outletPerformance);
        analytics.put("popularItems", popularItems);
        analytics.put("dailySales", dailySalesList);
        analytics.put("paymentBreakdown", paymentList);

        return analytics;
    }
}
