package com.restaurant.service;

import com.restaurant.entity.Notification;
import com.restaurant.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getOutletNotifications(Long outletId) {
        return notificationRepository.findByOutletIdOrderByCreatedAtDesc(outletId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification not found with id: " + notificationId));
        notif.setIsRead(true);
        return notificationRepository.save(notif);
    }
}
