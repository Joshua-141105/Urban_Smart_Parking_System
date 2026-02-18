package com.example.parkingsystem.controller;

import com.example.parkingsystem.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/city-stats")
    @PreAuthorize("hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> getCityStats() {
        return ResponseEntity.ok(analyticsService.getCityWideStats());
    }

    @GetMapping("/manager-stats")
    @PreAuthorize("hasRole('PARKING_MANAGER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> getManagerStats(
            @org.springframework.web.bind.annotation.RequestParam Long lotId) {
        return ResponseEntity.ok(analyticsService.getLotManagerStats(lotId));
    }

    @GetMapping("/predictions")
    public ResponseEntity<?> getOccupancyPredictions() {
        // Simulate time-series data for next 24 hours
        java.util.List<Map<String, Object>> predictions = new java.util.ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // Simple pattern: High during day (9-5), low at night
        for (int i = 0; i < 24; i++) {
            java.time.LocalDateTime time = now.plusHours(i);
            int hour = time.getHour();

            // Base occupancy seed
            double baseOccupancy = 20.0;

            if (hour >= 8 && hour <= 10)
                baseOccupancy = 70.0; // Morning rush
            else if (hour > 10 && hour < 17)
                baseOccupancy = 60.0; // Work hours
            else if (hour >= 17 && hour <= 19)
                baseOccupancy = 85.0; // Evening rush
            else if (hour > 19 && hour < 22)
                baseOccupancy = 40.0; // Dinner time
            else
                baseOccupancy = 10.0; // Night

            // Add some randomness
            double randomness = (java.lang.Math.random() * 20) - 10; // +/- 10%
            double prediction = Math.min(100, Math.max(0, baseOccupancy + randomness));

            java.util.Map<String, Object> point = new java.util.HashMap<>();
            point.put("time", time.format(java.time.format.DateTimeFormatter.ofPattern("HH:00")));
            point.put("occupancy", Math.round(prediction));
            predictions.add(point);
        }

        return ResponseEntity.ok(predictions);
    }
}
