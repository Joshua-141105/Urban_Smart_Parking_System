package com.example.parkingsystem.controller;

import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> updates) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("phoneNumber")) {
            user.setPhoneNumber((String) updates.get("phoneNumber"));
        }
        if (updates.containsKey("notifyEmail")) {
            user.setNotifyEmail((Boolean) updates.get("notifyEmail"));
        }
        if (updates.containsKey("notifySms")) {
            user.setNotifySms((Boolean) updates.get("notifySms"));
        }
        if (updates.containsKey("accessibilityNeeds")) {
            user.setAccessibilityNeeds((String) updates.get("accessibilityNeeds"));
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}
