package com.restaurant.service;

import com.restaurant.dto.*;
import com.restaurant.entity.*;
import com.restaurant.repository.*;
import com.restaurant.security.JwtUtils;
import com.restaurant.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OutletStaffRepository outletStaffRepository;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final CustomerMarketingPreferenceRepository marketingPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditLogService auditLogService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       OutletStaffRepository outletStaffRepository,
                       LoyaltyAccountRepository loyaltyAccountRepository,
                       CustomerMarketingPreferenceRepository marketingPreferenceRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       AuditLogService auditLogService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.outletStaffRepository = outletStaffRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.marketingPreferenceRepository = marketingPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(authentication);

        Integer loyaltyPoints = 0;
        Optional<LoyaltyAccount> loyaltyOpt = loyaltyAccountRepository.findByUserId(userPrincipal.getId());
        if (loyaltyOpt.isPresent()) {
            loyaltyPoints = loyaltyOpt.get().getPointsBalance();
        }

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getName(),
                userPrincipal.getEmail(),
                "",
                userPrincipal.getRole(),
                userPrincipal.getOutletId(),
                loyaltyPoints
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Error: Email is already registered!");
        }

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role not found in system"));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(customerRole);
        user.setIsActive(true);
        User savedUser = userRepository.save(user);

        // Create initial loyalty account with 50 bonus welcome points
        LoyaltyAccount loyaltyAccount = new LoyaltyAccount();
        loyaltyAccount.setUser(savedUser);
        loyaltyAccount.setPointsBalance(50);
        loyaltyAccount.setLifetimePointsEarned(50);
        loyaltyAccount.setTier("BRONZE");
        loyaltyAccountRepository.save(loyaltyAccount);

        // Save DPDP Act marketing preferences
        CustomerMarketingPreference preferences = new CustomerMarketingPreference();
        preferences.setUser(savedUser);
        preferences.setEmailPromotions(Boolean.TRUE.equals(request.getEmailPromotions()));
        preferences.setSmsPromotions(Boolean.TRUE.equals(request.getSmsPromotions()));
        preferences.setWhatsappUpdates(Boolean.TRUE.equals(request.getWhatsappUpdates()));
        marketingPreferenceRepository.save(preferences);

        // Audit log
        auditLogService.log(savedUser.getId(), savedUser.getName(), "CUSTOMER", "USER_REGISTERED", "USER", savedUser.getId().toString(), "Customer registered with phone: " + savedUser.getPhone());

        // Authenticate & create JWT
        UserPrincipal userPrincipal = UserPrincipal.create(savedUser, null);
        String jwt = jwtUtils.generateTokenFromUser(userPrincipal);

        return new AuthResponse(
                jwt,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                "CUSTOMER",
                null,
                50
        );
    }

    @Transactional
    public Map<String, Object> handleForgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No registered account found with email: " + request.getEmail()));

        String token = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiry(java.time.LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        auditLogService.log(user.getId(), user.getName(), user.getRole().getName(), "PASSWORD_RESET_REQUESTED", "USER", user.getId().toString(), "Password reset token generated: " + token);

        Map<String, Object> res = new java.util.HashMap<>();
        res.put("success", true);
        res.put("message", "Password reset instructions dispatched. Use the recovery token below to set your new password.");
        res.put("token", token); // Exposed for seamless testing & direct entry
        res.put("expiresAt", user.getResetPasswordExpiry().toString());
        return res;
    }

    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or unrecognized password reset token."));

        if (user.getResetPasswordExpiry() == null || user.getResetPasswordExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset token has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);

        auditLogService.log(user.getId(), user.getName(), user.getRole().getName(), "PASSWORD_RESET_COMPLETED", "USER", user.getId().toString(), "Password successfully updated.");

        Map<String, Object> res = new java.util.HashMap<>();
        res.put("success", true);
        res.put("message", "Password reset successful! You can now sign in with your new password.");
        return res;
    }

    @Transactional
    public User updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        User updated = userRepository.save(user);

        auditLogService.log(user.getId(), user.getName(), user.getRole().getName(), "PROFILE_UPDATED", "USER", user.getId().toString(), "Updated name to " + request.getName() + ", phone to " + request.getPhone());
        return updated;
    }
}
