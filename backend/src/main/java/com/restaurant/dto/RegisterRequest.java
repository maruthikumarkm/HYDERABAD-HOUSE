package com.restaurant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    // DPDP Act 2023 Marketing consent (optional)
    private Boolean emailPromotions = false;
    private Boolean smsPromotions = false;
    private Boolean whatsappUpdates = false;

    public RegisterRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getEmailPromotions() { return emailPromotions; }
    public void setEmailPromotions(Boolean emailPromotions) { this.emailPromotions = emailPromotions; }

    public Boolean getSmsPromotions() { return smsPromotions; }
    public void setSmsPromotions(Boolean smsPromotions) { this.smsPromotions = smsPromotions; }

    public Boolean getWhatsappUpdates() { return whatsappUpdates; }
    public void setWhatsappUpdates(Boolean whatsappUpdates) { this.whatsappUpdates = whatsappUpdates; }
}
