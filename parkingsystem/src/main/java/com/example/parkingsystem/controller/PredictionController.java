package com.example.parkingsystem.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PredictionController  (v2 — lot-specific)
 * ───────────────────────────────────────────
 * Extends the original controller to support lot-specific occupancy predictions.
 *
 * WHAT CHANGED FROM v1
 * ────────────────────
 * 1. predictOccupancy() now accepts `lotId` query param (optional).
 *    When provided, it is forwarded to the ML server as `lotId`.
 *    Calls without lotId continue to work exactly as before.
 *
 * 2. Per-lot cache: each lotId gets its own 5-minute cache entry,
 *    so predictions for different lots don't overwrite each other.
 *
 * 3. GET /api/lots (NEW): proxies /api/lots from the ML server,
 *    returning the list of lot IDs the model knows about.
 *    Falls back to empty list if ML server is offline.
 *
 * BACKWARD COMPATIBILITY
 * ──────────────────────
 * All v1 callers that omit lotId continue to work unchanged.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class PredictionController {

    @Value("${ml.server.url:http://localhost:5001}")
    private String mlServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Per-lot cache ────────────────────────────────────────────────────────
    // Key: lotId as String ("null" for generic calls), Value: {prediction, timestamp}
    private final ConcurrentHashMap<String, CachedEntry> predictionCache =
            new ConcurrentHashMap<>();

    private static final long CACHE_TTL_MS = 5 * 60 * 1000L; // 5 minutes

    private static class CachedEntry {
        final Map<String, Object> data;
        final long timestamp;
        CachedEntry(Map<String, Object> data) {
            this.data      = data;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * GET /api/predict-occupancy
     *
     * Query params (all optional):
     *   lotId               — NEW: parking lot ID for lot-specific prediction
     *   hour_of_day         — 0-23
     *   day_of_week         — 0-6
     *   is_weekend          — 0/1
     *   current_occupancy   — current occupied slots (used for confidence adj.)
     *   total_slots         — lot capacity
     *   bookings_last_hour  — recent booking count
     *
     * Without lotId: behaves identically to v1.
     * With lotId: forwards to ML server for lot-specific forecast.
     */
    @GetMapping("/predict-occupancy")
    public ResponseEntity<Map<String, Object>> predictOccupancy(
            @RequestParam(required = false) Long    lotId,
            @RequestParam(required = false) Integer hour_of_day,
            @RequestParam(required = false) Integer day_of_week,
            @RequestParam(required = false) Integer is_weekend,
            @RequestParam(required = false) Double  current_occupancy,
            @RequestParam(required = false) Integer total_slots,
            @RequestParam(required = false) Integer bookings_last_hour) {

        // Cache key: "null" for generic calls, "7" for lotId=7, etc.
        String cacheKey = lotId != null ? String.valueOf(lotId) : "null";

        // Only use cache when no time-sensitive params override defaults
        boolean useCache = hour_of_day == null && bookings_last_hour == null;
        if (useCache) {
            CachedEntry cached = predictionCache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                log.debug("Cache hit for lotId={}", lotId);
                return ResponseEntity.ok(cached.data);
            }
        }

        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromHttpUrl(mlServerUrl + "/api/predict-occupancy");

            // Forward lotId (NEW)
            if (lotId              != null) builder.queryParam("lotId",               lotId);
            // Forward remaining params unchanged (v1 backward-compat)
            if (hour_of_day        != null) builder.queryParam("hour_of_day",         hour_of_day);
            if (day_of_week        != null) builder.queryParam("day_of_week",         day_of_week);
            if (is_weekend         != null) builder.queryParam("is_weekend",          is_weekend);
            if (current_occupancy  != null) builder.queryParam("current_occupancy",   current_occupancy);
            if (total_slots        != null) builder.queryParam("total_slots",         total_slots);
            if (bookings_last_hour != null) builder.queryParam("bookings_last_hour",  bookings_last_hour);

            String url = builder.toUriString();
            log.debug("ML call: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> mlResponse = restTemplate.getForObject(url, Map.class);

            if (useCache && mlResponse != null) {
                predictionCache.put(cacheKey, new CachedEntry(mlResponse));
            }

            return ResponseEntity.ok(mlResponse);

        } catch (Exception e) {
            log.warn("ML server unavailable ({}), using fallback for lotId={}", e.getMessage(), lotId);
            return ResponseEntity.ok(ruleBasedFallback(lotId));
        }
    }

    /**
     * GET /api/lots
     * NEW — returns all parking lot IDs the ML model knows about.
     * Used by the frontend dropdown to populate the lot selector.
     * Returns empty list if ML server is offline.
     */
    @GetMapping("/lots")
    public ResponseEntity<Map<String, Object>> getLots() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    mlServerUrl + "/api/lots", Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Could not fetch lot list from ML server: {}", e.getMessage());
            // Return empty but valid response — frontend handles gracefully
            Map<String, Object> empty = new HashMap<>();
            empty.put("lotIds", java.util.Collections.emptyList());
            empty.put("count",  0);
            empty.put("offline", true);
            return ResponseEntity.ok(empty);
        }
    }

    /**
     * GET /api/ml-status  — unchanged from v1
     */
    @GetMapping("/ml-status")
    public ResponseEntity<Map<String, Object>> mlStatus() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> status = restTemplate.getForObject(
                    mlServerUrl + "/api/model-status", Map.class);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            Map<String, Object> offline = new HashMap<>();
            offline.put("modelReady", false);
            offline.put("error", "ML server offline: " + e.getMessage());
            return ResponseEntity.ok(offline);
        }
    }

    /**
     * POST /api/training-data — unchanged from v1
     * Accepts optional parking_lot_id field in body (forwarded to ML server).
     */
    @PostMapping("/training-data")
    public ResponseEntity<Map<String, Object>> addTrainingData(
            @RequestBody Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    mlServerUrl + "/api/training-data", entity, Map.class);

            // Invalidate cache for this lot after new training data
            if (body.containsKey("parking_lot_id")) {
                String key = String.valueOf(body.get("parking_lot_id"));
                predictionCache.remove(key);
                log.debug("Cache invalidated for lotId={}", key);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Failed to forward training data: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", "ML server offline"));
        }
    }

    // ── Rule-based fallback ──────────────────────────────────────────────────

    private Map<String, Object> ruleBasedFallback(Long lotId) {
        LocalDateTime now  = LocalDateTime.now();
        int hour           = now.getHour();
        int dow            = now.getDayOfWeek().getValue();  // 1=Mon, 7=Sun
        boolean isWeekend  = dow >= 6;

        double predicted;
        if (isWeekend) {
            predicted = (hour >= 10 && hour <= 20) ? 62.0 : 30.0;
        } else if (hour >= 8 && hour <= 10) {
            predicted = 82.0;
        } else if (hour >= 17 && hour <= 19) {
            predicted = 85.0;
        } else if (hour < 6 || hour > 22) {
            predicted = 12.0;
        } else {
            predicted = 52.0;
        }

        predicted += (Math.random() * 10 - 5);
        predicted  = Math.max(0, Math.min(100, predicted));

        String risk    = predicted < 50 ? "Low" : predicted < 75 ? "Medium" :
                         predicted < 90 ? "High" : "Critical";
        String message = predicted < 50 ? "Plenty of spots available" :
                         predicted < 75 ? "Moderate demand — book soon" :
                         predicted < 90 ? "High demand expected" : "Near full capacity";

        Map<String, Object> result = new HashMap<>();
        result.put("predictedOccupancy", Math.round(predicted * 10.0) / 10.0);
        result.put("confidence",   60);
        result.put("riskLevel",    risk);
        result.put("message",      message);
        result.put("modelVersion", "fallback-rule-based");
        result.put("lotId",        lotId);
        result.put("fallback",     true);
        return result;
    }
}