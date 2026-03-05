package com.example.parkingsystem.controller;

import com.example.parkingsystem.dto.JwtResponse;
import com.example.parkingsystem.dto.LoginRequest;
import com.example.parkingsystem.dto.MessageResponse;
import com.example.parkingsystem.dto.ResetPasswordRequest;
import com.example.parkingsystem.dto.SignupRequest;
import com.example.parkingsystem.entity.Role;
import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.UserRepository;
import com.example.parkingsystem.security.JwtUtils;
import com.example.parkingsystem.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final PasswordEncoder encoder;
        private final JwtUtils jwtUtils;

        @PostMapping("/signin")
        public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = jwtUtils.generateJwtToken(authentication);

                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                String role = userDetails.getAuthorities().stream()
                                .findFirst()
                                .map(item -> item.getAuthority())
                                .orElse("ROLE_DRIVER");

                return ResponseEntity.ok(new JwtResponse(jwt,
                                userDetails.getId(),
                                userDetails.getUsername(),
                                userDetails.getEmail(),
                                role));
        }

        @PostMapping("/signup")
        public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
                if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new MessageResponse("Error: Username is already taken!"));
                }

                if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new MessageResponse("Error: Email is already in use!"));
                }

                // Public signup always creates DRIVER accounts
                // Other roles (PARKING_MANAGER, CITY_ADMIN, etc.) are created by System Admin
                User user = User.builder()
                                .username(signUpRequest.getUsername())
                                .email(signUpRequest.getEmail())
                                .password(encoder.encode(signUpRequest.getPassword()))
                                .role(Role.DRIVER)
                                .isActive(true)
                                .build();

                userRepository.save(user);

                return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        }

        @PostMapping("/verify-user")
        public ResponseEntity<?> verifyUser(@RequestBody java.util.Map<String, String> request) {
                String input = request.get("usernameOrEmail");
                if (input == null || input.isBlank()) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new MessageResponse("Error: Username or email is required."));
                }

                boolean exists = userRepository.findByUsername(input).isPresent()
                                || userRepository.findByEmail(input).isPresent();

                if (!exists) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new MessageResponse(
                                                        "Error: No account found with that username or email."));
                }

                return ResponseEntity.ok(new MessageResponse("User verified successfully."));
        }

        @PostMapping("/reset-password")
        public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
                String input = request.getUsernameOrEmail();

                // Try finding user by username first, then by email
                User user = userRepository.findByUsername(input)
                                .orElse(userRepository.findByEmail(input).orElse(null));

                if (user == null) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new MessageResponse(
                                                        "Error: No account found with that username or email."));
                }

                user.setPassword(encoder.encode(request.getNewPassword()));
                userRepository.save(user);

                return ResponseEntity.ok(new MessageResponse("Password has been reset successfully!"));
        }
}
