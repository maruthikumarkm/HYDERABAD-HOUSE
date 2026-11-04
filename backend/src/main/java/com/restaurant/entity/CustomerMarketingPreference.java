package com.restaurant.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_marketing_preferences")
public class CustomerMarketingPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Column(name = "email_promotions", nullable = false)
    private Boolean emailPromotions = false;

    @Column(name = "sms_promotions", nullable = false)
    private Boolean smsPromotions = false;

    @Column(name = "whatsapp_updates", nullable = false)
    private Boolean whatsappUpdates = false;

    @Column(name = "consent_timestamp", updatable = false)
    private LocalDateTime consentTimestamp;

    @Column(name = "privacy_policy_version", nullable = false, length = 20)
    private String privacyPolicyVersion = "v1.0-2024";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        consentTimestamp = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public CustomerMarketingPreference() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Boolean getEmailPromotions() { return emailPromotions; }
    public void setEmailPromotions(Boolean emailPromotions) { this.emailPromotions = emailPromotions; }

    public Boolean getSmsPromotions() { return smsPromotions; }
    public void setSmsPromotions(Boolean smsPromotions) { this.smsPromotions = smsPromotions; }

    public Boolean getWhatsappUpdates() { return whatsappUpdates; }
    public void setWhatsappUpdates(Boolean whatsappUpdates) { this.whatsappUpdates = whatsappUpdates; }

    public LocalDateTime getConsentTimestamp() { return consentTimestamp; }
    public void setConsentTimestamp(LocalDateTime consentTimestamp) { this.consentTimestamp = consentTimestamp; }

    public String getPrivacyPolicyVersion() { return privacyPolicyVersion; }
    public void setPrivacyPolicyVersion(String privacyPolicyVersion) { this.privacyPolicyVersion = privacyPolicyVersion; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
