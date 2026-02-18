package com.example.parkingsystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class RouteEngineService {

    @Value("${osrm.api.url}")
    private String osrmUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final double EARTH_RADIUS = 6371.0; // km

    /**
     * Calculate Haversine distance between two coordinates.
     */
    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS * c;
    }

    /**
     * Get route information from OSRM or fallback to calculated values.
     */
    public Map<String, Object> getRoute(double startLat, double startLon, double endLat, double endLon) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Try OSRM API call
            String url = String.format("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=polyline",
                    osrmUrl, startLon, startLat, endLon, endLat);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "Ok".equals(response.get("code"))) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> routes = (java.util.List<Map<String, Object>>) response
                        .get("routes");

                if (routes != null && !routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);

                    // Distance in meters -> convert to km
                    double distanceMeters = ((Number) route.get("distance")).doubleValue();
                    double distanceKm = distanceMeters / 1000.0;

                    // Duration in seconds -> convert to minutes
                    double durationSeconds = ((Number) route.get("duration")).doubleValue();
                    int durationMinutes = (int) Math.ceil(durationSeconds / 60.0);

                    result.put("distance", Math.round(distanceKm * 10.0) / 10.0);
                    result.put("duration", durationMinutes);
                    result.put("polyline", route.get("geometry"));
                    result.put("source", "osrm");

                    return result;
                }
            }
        } catch (Exception e) {
            // Fall back to calculated values
        }

        // Fallback calculation
        double distance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
        double drivingDistance = distance * 1.3; // Assume 30% longer for roads
        int duration = (int) Math.ceil(drivingDistance * 3); // ~3 min per km in city

        result.put("distance", Math.round(drivingDistance * 10.0) / 10.0);
        result.put("duration", duration);
        result.put("polyline", null);
        result.put("source", "calculated");

        return result;
    }

    /**
     * Get a mock route polyline (for demo).
     */
    public String getRoutePolyline(double startLat, double startLon, double endLat, double endLon) {
        try {
            Map<String, Object> route = getRoute(startLat, startLon, endLat, endLon);
            return (String) route.get("polyline");
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Get driving distance (uses OSRM or fallback).
     */
    public double getDrivingDistance(double startLat, double startLon, double endLat, double endLon) {
        try {
            Map<String, Object> route = getRoute(startLat, startLon, endLat, endLon);
            return ((Number) route.get("distance")).doubleValue();
        } catch (Exception e) {
            return calculateHaversineDistance(startLat, startLon, endLat, endLon) * 1.3;
        }
    }

    /**
     * Get driving time in minutes.
     */
    public double getDrivingTimeMinutes(double startLat, double startLon, double endLat, double endLon) {
        try {
            Map<String, Object> route = getRoute(startLat, startLon, endLat, endLon);
            return ((Number) route.get("duration")).doubleValue();
        } catch (Exception e) {
            double distKm = getDrivingDistance(startLat, startLon, endLat, endLon);
            return Math.ceil(distKm * 3); // ~3 min per km
        }
    }
}
