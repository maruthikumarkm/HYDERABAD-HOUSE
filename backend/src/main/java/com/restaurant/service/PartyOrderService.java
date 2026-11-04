package com.restaurant.service;

import com.restaurant.dto.PartyOrderRequest;
import com.restaurant.dto.PartyOrderStatusRequest;
import com.restaurant.entity.Outlet;
import com.restaurant.entity.PartyOrder;
import com.restaurant.repository.OutletRepository;
import com.restaurant.repository.PartyOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PartyOrderService {

    private final PartyOrderRepository partyOrderRepository;
    private final OutletRepository outletRepository;

    public PartyOrderService(PartyOrderRepository partyOrderRepository, OutletRepository outletRepository) {
        this.partyOrderRepository = partyOrderRepository;
        this.outletRepository = outletRepository;
    }

    @Transactional
    public PartyOrder submitPartyOrder(PartyOrderRequest request) {
        // Validate minimum advance notice (at least 2 days in advance)
        LocalDate minAdvanceDate = LocalDate.now().plusDays(2);
        if (request.getEventDate().isBefore(minAdvanceDate)) {
            throw new IllegalArgumentException("Party orders require a minimum of 48 hours (2 days) advance notice.");
        }

        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new NoSuchElementException("Preferred outlet not found with id: " + request.getOutletId()));

        PartyOrder order = new PartyOrder();
        order.setCustomerName(request.getCustomerName());
        order.setPhoneNumber(request.getPhoneNumber());
        order.setEmail(request.getEmail());
        order.setEventDate(request.getEventDate());
        order.setEventTime(request.getEventTime());
        order.setNumberOfGuests(request.getNumberOfGuests());
        order.setOutlet(outlet);
        order.setFoodSelectionsJson(request.getFoodSelectionsJson());
        order.setEstimatedBudget(request.getEstimatedBudget());
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setStatus("PENDING");

        return partyOrderRepository.save(order);
    }

    public List<PartyOrder> getAllPartyOrders() {
        return partyOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PartyOrder> getPartyOrdersByOutlet(Long outletId) {
        return partyOrderRepository.findByOutletIdOrderByCreatedAtDesc(outletId);
    }

    @Transactional
    public PartyOrder updatePartyOrderStatus(Long id, PartyOrderStatusRequest request) {
        PartyOrder order = partyOrderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Party order not found with id: " + id));

        order.setStatus(request.getStatus().toUpperCase());
        if (request.getNotes() != null) {
            order.setCateringManagerNotes(request.getNotes());
        }

        return partyOrderRepository.save(order);
    }
}
