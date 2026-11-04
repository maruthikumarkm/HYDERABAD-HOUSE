package com.restaurant.service;

import com.restaurant.dto.MenuItemRequest;
import com.restaurant.dto.OutletOverrideRequest;
import com.restaurant.entity.*;
import com.restaurant.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class MenuService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final OutletMenuRepository outletMenuRepository;
    private final AddOnRepository addOnRepository;
    private final OutletRepository outletRepository;

    public MenuService(MenuCategoryRepository categoryRepository,
                       MenuItemRepository menuItemRepository,
                       OutletMenuRepository outletMenuRepository,
                       AddOnRepository addOnRepository,
                       OutletRepository outletRepository) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.outletMenuRepository = outletMenuRepository;
        this.addOnRepository = addOnRepository;
        this.outletRepository = outletRepository;
    }

    public List<MenuCategory> getAllActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public List<MenuItem> getAllActiveItems() {
        return menuItemRepository.findByIsActiveTrue();
    }

    public List<Map<String, Object>> getMenuItemsForOutlet(Long outletId) {
        List<MenuItem> allItems = menuItemRepository.findByIsActiveTrue();
        List<OutletMenu> overrides = outletMenuRepository.findByOutletId(outletId);
        Map<Long, OutletMenu> overrideMap = new HashMap<>();
        for (OutletMenu om : overrides) {
            overrideMap.put(om.getMenuItem().getId(), om);
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (MenuItem item : allItems) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("categoryId", item.getCategory().getId());
            map.put("categoryName", item.getCategory().getName());
            map.put("name", item.getName());
            map.put("description", item.getDescription());
            map.put("isVeg", item.getIsVeg());
            map.put("spiceLevel", item.getSpiceLevel());
            map.put("portionSize", item.getPortionSize());
            map.put("imageUrl", item.getImageUrl());
            map.put("allergenInfo", item.getAllergenInfo());
            map.put("prepTimeMinutes", item.getPrepTimeMinutes());

            OutletMenu om = overrideMap.get(item.getId());
            if (om != null) {
                map.put("price", om.getCustomPrice() != null ? om.getCustomPrice() : item.getBasePrice());
                map.put("isAvailable", om.getIsAvailable());
                map.put("isFeatured", om.getIsFeatured());
            } else {
                map.put("price", item.getBasePrice());
                map.put("isAvailable", true);
                map.put("isFeatured", false);
            }
            response.add(map);
        }
        return response;
    }

    public List<AddOn> getAddOnsForItem(Long menuItemId) {
        return addOnRepository.findByMenuItemIdOrMenuItemIdIsNullAndIsAvailableTrue(menuItemId);
    }

    @Transactional
    public MenuItem createMenuItem(MenuItemRequest request) {
        MenuCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found"));

        MenuItem item = new MenuItem();
        item.setCategory(category);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setBasePrice(request.getBasePrice());
        item.setIsVeg(Boolean.TRUE.equals(request.getIsVeg()));
        item.setSpiceLevel(request.getSpiceLevel() != null ? request.getSpiceLevel() : "MEDIUM");
        item.setPortionSize(request.getPortionSize() != null ? request.getPortionSize() : "Regular");
        item.setImageUrl(request.getImageUrl());
        item.setAllergenInfo(request.getAllergenInfo());
        item.setPrepTimeMinutes(request.getPrepTimeMinutes() != null ? request.getPrepTimeMinutes() : 20);
        item.setIsActive(Boolean.TRUE.equals(request.getIsActive()));
        MenuItem saved = menuItemRepository.save(item);

        // Auto create default availability across all outlets
        List<Outlet> outlets = outletRepository.findAll();
        for (Outlet o : outlets) {
            OutletMenu om = new OutletMenu();
            om.setOutlet(o);
            om.setMenuItem(saved);
            om.setIsAvailable(true);
            om.setIsFeatured(false);
            outletMenuRepository.save(om);
        }

        return saved;
    }

    @Transactional
    public MenuItem updateMenuItem(Long id, MenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Menu item not found with id: " + id));

        MenuCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found"));

        item.setCategory(category);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setBasePrice(request.getBasePrice());
        item.setIsVeg(Boolean.TRUE.equals(request.getIsVeg()));
        if (request.getSpiceLevel() != null) item.setSpiceLevel(request.getSpiceLevel());
        if (request.getPortionSize() != null) item.setPortionSize(request.getPortionSize());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        item.setAllergenInfo(request.getAllergenInfo());
        if (request.getPrepTimeMinutes() != null) item.setPrepTimeMinutes(request.getPrepTimeMinutes());
        if (request.getIsActive() != null) item.setIsActive(request.getIsActive());

        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem toggleItemStatus(Long id, boolean active) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Menu item not found with id: " + id));
        item.setIsActive(active);
        return menuItemRepository.save(item);
    }

    @Transactional
    public OutletMenu setOutletItemOverride(Long outletId, Long menuItemId, OutletOverrideRequest request) {
        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new NoSuchElementException("Outlet not found"));
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new NoSuchElementException("Menu item not found"));

        OutletMenu om = outletMenuRepository.findByOutletIdAndMenuItemId(outletId, menuItemId)
                .orElseGet(() -> {
                    OutletMenu newOm = new OutletMenu();
                    newOm.setOutlet(outlet);
                    newOm.setMenuItem(item);
                    return newOm;
                });

        if (request.getCustomPrice() != null) om.setCustomPrice(request.getCustomPrice());
        if (request.getIsAvailable() != null) om.setIsAvailable(request.getIsAvailable());
        if (request.getIsFeatured() != null) om.setIsFeatured(request.getIsFeatured());

        return outletMenuRepository.save(om);
    }
}
