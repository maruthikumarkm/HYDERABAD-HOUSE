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

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       OutletStaffRepository outletStaffRepository,
                       LoyaltyAccountRepository loyaltyAccountRepository,
                       CustomerMarketingPreferenceRepository marketingPreferenceRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.outletStaffRepository = outletStaffRepository;
        this.loyaltyAccountRepository = loyaltyAccountRepository;
        this.marketingPreferenceRepository = marketingPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
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

    public String handleForgotPassword(ForgotPasswordRequest request) {
        // In demo environment, verify user exists or mock recovery flow
        return "Demo recovery token generated. A password reset link has been dispatched to: " + request.getEmail();
    }
}
