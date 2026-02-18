package com.example.parkingsystem.controller;

import com.example.parkingsystem.dto.ParkingLotRequest;
import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.entity.ParkingSpace;
import com.example.parkingsystem.repository.ParkingLotRepository;
import com.example.parkingsystem.repository.ParkingSpaceRepository;
import com.example.parkingsystem.repository.ReviewRepository;
import com.example.parkingsystem.entity.Review;
import com.example.parkingsystem.service.ParkingService;
import com.example.parkingsystem.service.RouteEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parking")
@RequiredArgsConstructor
public class ParkingController {

    private final ParkingService parkingService;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSpaceRepository parkingSpaceRepository;
    private final ReviewRepository reviewRepository;
    private final RouteEngineService routeEngineService;

    /**
     * Get nearest parking lots based on user location.
     */
    @GetMapping("/nearest")
    public ResponseEntity<List<Map<String, Object>>> getNearestParking(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "5.0") double radius) {

        List<ParkingLot> lots = parkingService.findNearestParking(lat, lon, radius);
        List<Map<String, Object>> response = enrichLotsWithOccupancy(lots, lat, lon);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all parking lots with live occupancy data.
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllParkingLots(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {

        List<ParkingLot> lots = parkingLotRepository.findAll();

        double userLat = lat != null ? lat : 12.9716;
        double userLon = lon != null ? lon : 77.5946;

        List<Map<String, Object>> response = enrichLotsWithOccupancy(lots, userLat, userLon);

        // Sort by distance if coordinates provided
        if (lat != null && lon != null) {
            response.sort(Comparator.comparingDouble(m -> (Double) m.getOrDefault("distance", 999.0)));
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Search parking lots with pagination.
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchParkingLots(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {

        // Fetch paginated results
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<ParkingLot> parkingPage;

        if (query == null || query.trim().isEmpty()) {
            parkingPage = parkingLotRepository.findAll(pageable);
        } else {
            parkingPage = parkingLotRepository.findByNameContainingIgnoreCase(query, pageable);
        }

        double userLat = lat != null ? lat : 12.9716;
        double userLon = lon != null ? lon : 77.5946;

        // Enrich the content (using existing helper)
        List<Map<String, Object>> content = enrichLotsWithOccupancy(parkingPage.getContent(), userLat, userLon);

        // Sort by distance if coordinates provided (only for current page)
        // Ideally DB should sort by distance but that requires custom native query.
        // For now: filter/page then sort what we got.
        if (lat != null && lon != null) {
            content.sort(Comparator.comparingDouble(m -> (Double) m.getOrDefault("distance", 999.0)));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("currentPage", parkingPage.getNumber());
        response.put("totalItems", parkingPage.getTotalElements());
        response.put("totalPages", parkingPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * Get single parking lot details with availability.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getParkingLotDetails(@PathVariable Long id) {
        Optional<ParkingLot> lotOpt = parkingLotRepository.findById(id);

        if (lotOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ParkingLot lot = lotOpt.get();
        List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(id);

        long occupiedCount = spaces.stream().filter(ParkingSpace::isOccupied).count();
        long availableSlots = spaces.size() - occupiedCount;

        Map<String, Object> response = new HashMap<>();
        response.put("id", lot.getId());
        response.put("name", lot.getName());
        response.put("address", lot.getAddress());
        response.put("city", lot.getCity());
        response.put("latitude", lot.getLatitude());
        response.put("longitude", lot.getLongitude());
        response.put("totalCapacity", spaces.size());
        response.put("availableSlots", availableSlots);
        response.put("occupiedSlots", occupiedCount);
        response.put("baseRate", lot.getBaseRate());
        response.put("occupancyPercent", spaces.isEmpty() ? 0 : (occupiedCount * 100 / spaces.size()));

        // Include individual spaces
        List<Map<String, Object>> spacesList = spaces.stream().map(space -> {
            Map<String, Object> s = new HashMap<>();
            s.put("id", space.getId());
            s.put("spaceNumber", space.getSpaceNumber());
            s.put("isOccupied", space.isOccupied());
            s.put("vehicleType", space.getVehicleType().name());
            return s;
        }).collect(Collectors.toList());

        response.put("spaces", spacesList);

        return ResponseEntity.ok(response);
    }

    /**
     * Get route and ETA from user location to parking lot using OSRM.
     */
    @GetMapping("/{id}/route")
    public ResponseEntity<?> getRoute(
            @PathVariable Long id,
            @RequestParam double fromLat,
            @RequestParam double fromLon) {

        Optional<ParkingLot> lotOpt = parkingLotRepository.findById(id);

        if (lotOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ParkingLot lot = lotOpt.get();

        try {
            Map<String, Object> routeInfo = routeEngineService.getRoute(
                    fromLat, fromLon,
                    lot.getLatitude().doubleValue(), lot.getLongitude().doubleValue());

            routeInfo.put("lotId", lot.getId());
            routeInfo.put("lotName", lot.getName());

            return ResponseEntity.ok(routeInfo);
        } catch (Exception e) {
            // Fallback to simple distance calculation
            double distance = routeEngineService.calculateHaversineDistance(
                    fromLat, fromLon,
                    lot.getLatitude().doubleValue(), lot.getLongitude().doubleValue());

            Map<String, Object> fallback = new HashMap<>();
            fallback.put("lotId", lot.getId());
            fallback.put("lotName", lot.getName());
            fallback.put("distance", distance);
            fallback.put("duration", Math.round(distance * 3)); // Rough estimate: 3 min per km
            fallback.put("isFallback", true);

            return ResponseEntity.ok(fallback);
        }
    }

    /**
     * Create a new parking lot (Admin/Manager only).
     */
    @PostMapping
    @PreAuthorize("hasRole('PARKING_MANAGER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> createParkingLot(@RequestBody ParkingLotRequest request) {
        // Implementation for creating parking lot
        // This would be expanded based on requirements
        return ResponseEntity.ok("Parking lot creation endpoint");
    }

    /**
     * Simulate vehicle exit sensor - marks parking space as free.
     * Request body: { "vehicleNumber": "KA-01-AB-1234", "spaceId": 1 }
     */
    @PostMapping("/sensor/exit")
    public ResponseEntity<?> vehicleExitSensor(@RequestBody Map<String, Object> request) {
        String vehicleNumber = (String) request.get("vehicleNumber");
        Long spaceId = request.get("spaceId") != null ? Long.valueOf(request.get("spaceId").toString()) : null;

        if (spaceId == null && vehicleNumber == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Either spaceId or vehicleNumber is required"));
        }

        try {
            // If spaceId is provided, mark that specific space as free
            if (spaceId != null) {
                var spaceOpt = parkingSpaceRepository.findById(spaceId);
                if (spaceOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Space not found"));
                }

                ParkingSpace space = spaceOpt.get();
                if (!space.isOccupied()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Space is already free"));
                }

                space.setOccupied(false);
                parkingSpaceRepository.save(space);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Space " + space.getSpaceNumber() + " marked as free",
                        "spaceId", spaceId,
                        "vehicleNumber", vehicleNumber != null ? vehicleNumber : "N/A"));
            }

            // If only vehicleNumber is provided, we would need to look up the booking
            // For now, return a message that spaceId is preferred
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Please provide spaceId. Vehicle number lookup requires booking integration."));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error processing exit: " + e.getMessage()));
        }
    }

    /**
     * Simulate vehicle entry sensor - marks parking space as occupied.
     * Request body: { "vehicleNumber": "KA-01-AB-1234", "spaceId": 1 }
     */
    @PostMapping("/sensor/entry")
    public ResponseEntity<?> vehicleEntrySensor(@RequestBody Map<String, Object> request) {
        Long spaceId = request.get("spaceId") != null ? Long.valueOf(request.get("spaceId").toString()) : null;
        String vehicleNumber = (String) request.get("vehicleNumber");

        if (spaceId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "spaceId is required"));
        }

        try {
            var spaceOpt = parkingSpaceRepository.findById(spaceId);
            if (spaceOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Space not found"));
            }

            ParkingSpace space = spaceOpt.get();
            if (space.isOccupied()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Space is already occupied"));
            }

            space.setOccupied(true);
            parkingSpaceRepository.save(space);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Space " + space.getSpaceNumber() + " marked as occupied",
                    "spaceId", spaceId,
                    "vehicleNumber", vehicleNumber != null ? vehicleNumber : "N/A"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error processing entry: " + e.getMessage()));
        }
    }

    /**
     * Enriches parking lots with occupancy data and distance/ETA/Ratings.
     */
    private List<Map<String, Object>> enrichLotsWithOccupancy(List<ParkingLot> lots, double userLat, double userLon) {
        // Fetch all reviews stats once or per lot?
        // Optimally we should map lotId -> stats. For now, we'll do simple per-lot
        // fetch or assume repo exists.
        // Needs ReviewRepository injection.

        return lots.stream().map(lot -> {
            List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());

            long occupiedCount = spaces.stream().filter(ParkingSpace::isOccupied).count();
            long totalCapacity = spaces.isEmpty() ? lot.getTotalCapacity() : spaces.size();
            long availableSlots = totalCapacity - occupiedCount;

            double distance = routeEngineService.calculateHaversineDistance(
                    userLat, userLon,
                    lot.getLatitude().doubleValue(), lot.getLongitude().doubleValue());

            // Estimate ETA: ~3 mins per km in city traffic
            int eta = (int) Math.ceil(distance * 3);

            // Calculate Rating
            List<Review> reviews = reviewRepository.findByParkingLotId(lot.getId());
            double avgRating = 0.0;
            int reviewCount = reviews.size();

            if (reviewCount > 0) {
                avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
                avgRating = Math.round(avgRating * 10.0) / 10.0; // Round to 1 decimal
            }

            Map<String, Object> lotData = new HashMap<>();
            lotData.put("id", lot.getId());
            lotData.put("name", lot.getName());
            lotData.put("address", lot.getAddress());
            lotData.put("city", lot.getCity());
            lotData.put("latitude", lot.getLatitude().doubleValue());
            lotData.put("longitude", lot.getLongitude().doubleValue());
            lotData.put("totalCapacity", totalCapacity);
            lotData.put("availableSlots", availableSlots);
            lotData.put("occupiedSlots", occupiedCount);
            lotData.put("baseRate", lot.getBaseRate());
            lotData.put("distance", Math.round(distance * 10.0) / 10.0); // Round to 1 decimal
            lotData.put("eta", eta);
            lotData.put("occupancyPercent", totalCapacity > 0 ? (occupiedCount * 100 / totalCapacity) : 0);
            lotData.put("rating", avgRating);
            lotData.put("reviewCount", reviewCount);

            return lotData;
        }).collect(Collectors.toList());
    }
}
