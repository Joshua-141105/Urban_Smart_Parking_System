package com.example.parkingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ParkingPredictionService
 * ─────────────────────────
 * Bridges the Spring Boot parking APIs and the Flask ML microservice.
 *
 * Responsibilities:
 *   1. Fetch per-lot ML predictions (predictedOccupancy, riskLevel, confidence).
 *   2. Compute a recommendation score for each lot using a weighted formula:
 *        score = (0.30 × distanceScore) + (0.20 × costScore)
 *               + (0.25 × currentAvailScore) + (0.25 × predictedAvailScore)
 *      Higher score = better recommendation.
 *   3. Derive user-facing fields:
 *        - predictedAvailability (slots)
 *        - demandScore           (Low / Medium / High / Critical)
 *        - fillingFastAlert       (true when predicted occupancy > 75%)
 *        - bestTimeToArrive       (human-readable window from /api/best-time)
 *   4. Cache results per lot for 2 minutes to avoid hammering the ML server.
 *   5. Provide a rule-based fallback when the ML server is offline.
 */
@Service
@Slf4j
public class ParkingPredictionService {

    @Value("${ml.server.url:http://localhost:5001}")
    private String mlServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Per-lot prediction cache (2-minute TTL) ──────────────────────────────
    private final ConcurrentHashMap<Long, CachedPrediction> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 2 * 60 * 1000L;

    private static class CachedPrediction {
        final Map<String, Object> data;
        final long timestamp;
        CachedPrediction(Map<String, Object> data) {
            this.data      = data;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }

    // ── Recommendation weights ───────────────────────────────────────────────
    private static final double W_DISTANCE          = 0.30;
    private static final double W_COST              = 0.20;
    private static final double W_CURRENT_AVAIL     = 0.25;
    private static final double W_PREDICTED_AVAIL   = 0.25;

    // ── Max reference values for normalisation ───────────────────────────────
    private static final double MAX_DISTANCE_KM     = 15.0;
    private static final double MAX_RATE_PER_HOUR   = 100.0;

    // ────────────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Enriches a lot map (as returned by ParkingController.enrichLotsWithOccupancy)
     * with ML prediction fields.  Works in-place and also returns the map.
     */
    public Map<String, Object> enrichLotWithPrediction(Map<String, Object> lotData) {
        Long lotId = toLong(lotData.get("id"));
        if (lotId == null) return lotData;

        Map<String, Object> prediction = getPrediction(lotId,
                toDouble(lotData.get("availableSlots")),
                toDouble(lotData.get("totalCapacity")));

        // Attach ML fields
        lotData.put("predictedOccupancy",    prediction.get("predictedOccupancy"));
        lotData.put("predictedAvailability", prediction.get("predictedAvailability"));
        lotData.put("demandScore",           prediction.get("demandScore"));
        lotData.put("confidenceLevel",       prediction.get("confidenceLevel"));
        lotData.put("fillingFastAlert",      prediction.get("fillingFastAlert"));
        lotData.put("mlMessage",             prediction.get("message"));
        lotData.put("mlFallback",            prediction.get("fallback"));

        // Compute recommendation score
        double score = computeRecommendationScore(lotData, prediction);
        lotData.put("recommendationScore",   Math.round(score * 10.0) / 10.0);

        return lotData;
    }

    /**
     * Fetches the per-lot prediction (with cache).
     */
    public Map<String, Object> getPrediction(Long lotId,
                                              Double currentAvailability,
                                              Double totalCapacity) {
        // Check cache
        CachedPrediction cached = cache.get(lotId);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }

        Map<String, Object> result;
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(mlServerUrl + "/api/predict-occupancy")
                    .queryParam("lotId", lotId)
                    .toUriString();

            @SuppressWarnings("unchecked")
            Map<String, Object> mlResponse = restTemplate.getForObject(url, Map.class);

            result = buildPredictionResponse(lotId, mlResponse, totalCapacity);
        } catch (Exception e) {
            log.warn("ML server unavailable for lotId={}: {}", lotId, e.getMessage());
            result = buildFallbackPrediction(lotId, totalCapacity);
        }

        cache.put(lotId, new CachedPrediction(result));
        return result;
    }

    /**
     * Fetches best-time data from ML server for a given lot.
     */
    public Map<String, Object> getBestTime(Long lotId) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromHttpUrl(mlServerUrl + "/api/best-time");
            if (lotId != null) builder.queryParam("lotId", lotId);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    builder.toUriString(), Map.class);
            return response != null ? response : buildFallbackBestTime(lotId);
        } catch (Exception e) {
            log.warn("ML best-time unavailable for lotId={}: {}", lotId, e.getMessage());
            return buildFallbackBestTime(lotId);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Score computation
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Weighted recommendation score in [0, 100].
     * Higher = better recommendation.
     */
    private double computeRecommendationScore(Map<String, Object> lot,
                                               Map<String, Object> prediction) {
        // Distance: closer = higher score
        double distKm       = toDouble(lot.get("distance"));
        double distScore    = Math.max(0, 1.0 - (distKm / MAX_DISTANCE_KM)) * 100;

        // Cost: cheaper = higher score
        double rate         = toDouble(lot.get("baseRate"));
        double costScore    = Math.max(0, 1.0 - (rate / MAX_RATE_PER_HOUR)) * 100;

        // Current availability: more slots = higher score
        double available    = toDouble(lot.get("availableSlots"));
        double capacity     = toDouble(lot.get("totalCapacity"));
        double currAvailScore = capacity > 0 ? (available / capacity) * 100 : 0;

        // Predicted availability: less future occupancy = higher score
        double predictedOcc = toDouble(prediction.get("predictedOccupancy"));
        double predScore    = Math.max(0, 100 - predictedOcc);

        // Penalty: if filling fast, reduce score
        boolean fillingFast = Boolean.TRUE.equals(prediction.get("fillingFastAlert"));
        double penalty      = fillingFast ? 10.0 : 0.0;

        double score = (W_DISTANCE       * distScore)
                     + (W_COST           * costScore)
                     + (W_CURRENT_AVAIL  * currAvailScore)
                     + (W_PREDICTED_AVAIL * predScore)
                     - penalty;

        return Math.max(0, Math.min(100, score));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Response builders
    // ────────────────────────────────────────────────────────────────────────

    private Map<String, Object> buildPredictionResponse(Long lotId,
                                                         Map<String, Object> ml,
                                                         Double totalCapacity) {
        double predOcc   = toDouble(ml.get("predictedOccupancy"));
        int    conf      = ((Number) ml.getOrDefault("confidence", 75)).intValue();
        String risk      = (String) ml.getOrDefault("riskLevel", "Low");
        String message   = (String) ml.getOrDefault("message", "");

        double cap       = totalCapacity != null ? totalCapacity : 100.0;
        long predAvail   = Math.round(cap * (1.0 - predOcc / 100.0));

        String demandScore = toDemandScore(risk);
        boolean fillingFast = predOcc > 75.0;

        Map<String, Object> r = new HashMap<>();
        r.put("predictedOccupancy",    predOcc);
        r.put("predictedAvailability", Math.max(0, predAvail));
        r.put("demandScore",           demandScore);
        r.put("confidenceLevel",       conf);
        r.put("fillingFastAlert",      fillingFast);
        r.put("message",               message);
        r.put("fallback",              Boolean.FALSE.equals(ml.get("fallback")) ? false : ml.get("fallback"));
        r.put("modelVersion",          ml.getOrDefault("modelVersion", "unknown"));
        return r;
    }

    private Map<String, Object> buildFallbackPrediction(Long lotId, Double totalCapacity) {
        LocalDateTime now   = LocalDateTime.now();
        int hour            = now.getHour();
        boolean isWeekend   = now.getDayOfWeek().getValue() >= 6;

        double predOcc;
        if (isWeekend)                             predOcc = (hour >= 10 && hour <= 20) ? 62.0 : 30.0;
        else if (hour >= 8  && hour <= 10)         predOcc = 82.0;
        else if (hour >= 17 && hour <= 19)         predOcc = 85.0;
        else if (hour < 6 || hour > 22)            predOcc = 12.0;
        else                                       predOcc = 52.0;

        predOcc += (Math.random() * 10 - 5);
        predOcc  = Math.max(0, Math.min(100, predOcc));

        double cap     = totalCapacity != null ? totalCapacity : 100.0;
        long predAvail = Math.round(cap * (1.0 - predOcc / 100.0));

        String risk        = predOcc < 50 ? "Low" : predOcc < 75 ? "Medium" : predOcc < 90 ? "High" : "Critical";
        String demandScore = toDemandScore(risk);
        boolean fillingFast = predOcc > 75.0;

        Map<String, Object> r = new HashMap<>();
        r.put("predictedOccupancy",    Math.round(predOcc * 10.0) / 10.0);
        r.put("predictedAvailability", Math.max(0, predAvail));
        r.put("demandScore",           demandScore);
        r.put("confidenceLevel",       60);
        r.put("fillingFastAlert",      fillingFast);
        r.put("message",               ruleMessage(predOcc));
        r.put("fallback",              true);
        r.put("modelVersion",          "fallback-rule-based");
        return r;
    }

    private Map<String, Object> buildFallbackBestTime(Long lotId) {
        // Simple rule-based best-time when ML server is offline
        Map<String, Object> r = new HashMap<>();
        r.put("lotId",          lotId);
        r.put("bestHour",       14);
        r.put("bestLabel",      "14:00");
        r.put("bestOccupancy",  35.0);
        r.put("bestWindow",     "14:00–16:00");
        r.put("confidence",     60);
        r.put("fallback",       true);
        return r;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private String toDemandScore(String riskLevel) {
        return switch (riskLevel) {
            case "Critical" -> "Critical";
            case "High"     -> "High";
            case "Medium"   -> "Medium";
            default          -> "Low";
        };
    }

    private String ruleMessage(double pct) {
        if (pct < 50) return "Plenty of spots available. Great time to park!";
        if (pct < 75) return "Moderate demand. Spots filling up — book soon.";
        if (pct < 90) return "High demand expected. Limited spots remaining.";
        return "Near full capacity. Consider alternative parking.";
    }

    private double toDouble(Object v) {
        if (v == null) return 0.0;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0.0; }
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }
}
