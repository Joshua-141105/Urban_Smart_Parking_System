package com.example.parkingsystem.controller;

import com.example.parkingsystem.entity.MonthlyPermit;
import com.example.parkingsystem.security.UserDetailsImpl;
import com.example.parkingsystem.service.MonthlyPermitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permits")
@RequiredArgsConstructor
public class MonthlyPermitController {

    private final MonthlyPermitService permitService;

    @PostMapping("/buy")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> purchasePermit(@RequestBody Map<String, Long> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long lotId = request.get("lotId");
            MonthlyPermit permit = permitService.purchasePermit(userDetails.getId(), lotId);
            return ResponseEntity.ok(permit);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-permits")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<MonthlyPermit>> getUserPermits(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(permitService.getUserPermits(userDetails.getId()));
    }
}
