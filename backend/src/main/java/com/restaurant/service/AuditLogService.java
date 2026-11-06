package com.restaurant.service;

import com.restaurant.entity.AuditLog;
import com.restaurant.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(Long userId, String userName, String userRole, String action, String entityType, String entityId, String details) {
        try {
            AuditLog auditLog = new AuditLog(userId, userName, userRole, action, entityType, entityId, details);
            auditLogRepository.save(auditLog);
            logger.info("[AUDIT] Action: {}, Entity: {} ({}), User: {} ({})", action, entityType, entityId, userName, userRole);
        } catch (Exception e) {
            logger.error("Failed to persist audit log: {}", e.getMessage());
        }
    }

    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }
}
