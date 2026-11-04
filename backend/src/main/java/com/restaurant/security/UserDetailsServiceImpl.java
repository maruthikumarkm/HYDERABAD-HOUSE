package com.restaurant.security;

import com.restaurant.entity.OutletStaff;
import com.restaurant.entity.User;
import com.restaurant.repository.OutletStaffRepository;
import com.restaurant.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final OutletStaffRepository outletStaffRepository;

    public UserDetailsServiceImpl(UserRepository userRepository, OutletStaffRepository outletStaffRepository) {
        this.userRepository = userRepository;
        this.outletStaffRepository = outletStaffRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Long outletId = null;
        Optional<OutletStaff> staff = outletStaffRepository.findByUserId(user.getId());
        if (staff.isPresent()) {
            outletId = staff.get().getOutlet().getId();
        }

        return UserPrincipal.create(user, outletId);
    }
}
