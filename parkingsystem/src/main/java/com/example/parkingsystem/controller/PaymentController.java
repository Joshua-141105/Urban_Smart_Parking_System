package com.example.parkingsystem.controller;

import com.example.parkingsystem.entity.PaymentTransaction;
import com.example.parkingsystem.security.UserDetailsImpl;
import com.example.parkingsystem.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Double amount = Double.valueOf(request.get("amount").toString());
            String type = (String) request.get("type"); // BOOKING or PERMIT
            String method = (String) request.get("method"); // CARD, UPI, WALLET

            PaymentTransaction transaction = paymentService.processPayment(userDetails.getId(), amount, type, method);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "transactionId", transaction.getId(), // Return internal ID for linking
                    "txnRef", transaction.getTransactionId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
