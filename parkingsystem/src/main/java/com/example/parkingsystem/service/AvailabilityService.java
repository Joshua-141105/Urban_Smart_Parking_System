package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.ParkingSpace;
import com.example.parkingsystem.repository.ParkingLotRepository;
import com.example.parkingsystem.repository.ParkingSpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for checking parking space availability for a given time range.
 * Supports both real-time (now) and advance (future) booking scenarios.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AvailabilityService {

    private final ParkingSpaceRepository parkingSpaceRepository;
    private final ParkingLotRepository parkingLotRepository;

    /**
     * Get all available parking spaces for a specific lot and time range.
     * 
     * @param lotId     The parking lot ID
     * @param startTime The requested start time
     * @param endTime   The requested end time
     * @return List of available ParkingSpace entities
     */
    @Transactional(readOnly = true)
    public List<ParkingSpace> getAvailableSpaces(Long lotId, LocalDateTime startTime, LocalDateTime endTime) {
        validateTimeRange(startTime, endTime);

        log.debug("Checking availability for lot {} from {} to {}", lotId, startTime, endTime);

        List<ParkingSpace> availableSpaces = parkingSpaceRepository
                .findAvailableSpacesForTimeRange(lotId, startTime, endTime);

        log.debug("Found {} available spaces for lot {}", availableSpaces.size(), lotId);

        return availableSpaces;
    }

    /**
     * Get availability summary for a lot (count and list of space IDs).
     * 
     * @param lotId     The parking lot ID
     * @param startTime The requested start time
     * @param endTime   The requested end time
     * @return Map containing availableCount and spaceIds
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailabilitySummary(Long lotId, LocalDateTime startTime, LocalDateTime endTime) {
        List<ParkingSpace> availableSpaces = getAvailableSpaces(lotId, startTime, endTime);

        List<Long> spaceIds = availableSpaces.stream()
                .map(ParkingSpace::getId)
                .collect(Collectors.toList());

        List<Map<String, Object>> spaceDetails = availableSpaces.stream()
                .map(space -> Map.<String, Object>of(
                        "id", space.getId(),
                        "spaceNumber", space.getSpaceNumber(),
                        "vehicleType", space.getVehicleType().name()))
                .collect(Collectors.toList());

        // Get total capacity for the lot
        List<ParkingSpace> allSpaces = parkingSpaceRepository.findByParkingLotId(lotId);
        int totalCapacity = allSpaces.size();
        int maintenanceCount = (int) allSpaces.stream().filter(ParkingSpace::isMaintenance).count();

        return Map.of(
                "lotId", lotId,
                "startTime", startTime.toString(),
                "endTime", endTime.toString(),
                "totalCapacity", totalCapacity,
                "maintenanceSpaces", maintenanceCount,
                "availableCount", availableSpaces.size(),
                "occupiedCount", totalCapacity - maintenanceCount - availableSpaces.size(),
                "spaceIds", spaceIds,
                "spaces", spaceDetails);
    }

    /**
     * Check if a specific space is available for a given time range.
     * 
     * @param spaceId   The parking space ID
     * @param startTime The requested start time
     * @param endTime   The requested end time
     * @return true if the space is available, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isSpaceAvailable(Long spaceId, LocalDateTime startTime, LocalDateTime endTime) {
        validateTimeRange(startTime, endTime);

        // First check if space exists and is not under maintenance
        var spaceOpt = parkingSpaceRepository.findById(spaceId);
        if (spaceOpt.isEmpty()) {
            log.warn("Space {} not found", spaceId);
            return false;
        }

        ParkingSpace space = spaceOpt.get();
        if (space.isMaintenance()) {
            log.debug("Space {} is under maintenance", spaceId);
            return false;
        }

        // Check for overlapping bookings
        boolean available = parkingSpaceRepository.isSpaceAvailableForTimeRange(spaceId, startTime, endTime);

        log.debug("Space {} availability for {} to {}: {}", spaceId, startTime, endTime, available);

        return available;
    }

    /**
     * Validates that the time range is valid.
     * - startTime must be in the future (or within 5 minutes of now for real-time)
     * - endTime must be after startTime
     * - Maximum booking duration is 24 hours
     * - Maximum advance booking is 7 days
     */
    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }

        // Allow bookings starting up to 5 minutes in the past (for real-time edge cases)
        if (startTime.isBefore(now.minusMinutes(5))) {
            throw new IllegalArgumentException("Start time cannot be in the past");
        }

        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        // Maximum booking duration: 24 hours
        if (java.time.Duration.between(startTime, endTime).toHours() > 24) {
            throw new IllegalArgumentException("Maximum booking duration is 24 hours");
        }

        // Maximum advance booking: 7 days
        if (startTime.isAfter(now.plusDays(7))) {
            throw new IllegalArgumentException("Cannot book more than 7 days in advance");
        }
    }
}
