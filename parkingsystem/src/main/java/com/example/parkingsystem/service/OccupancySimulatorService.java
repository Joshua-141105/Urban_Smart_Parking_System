package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.entity.ParkingSpace;
import com.example.parkingsystem.repository.ParkingLotRepository;
import com.example.parkingsystem.repository.ParkingSpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
// import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OccupancySimulatorService {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSpaceRepository parkingSpaceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PricingEngineService pricingEngineService;

    private final Random random = new Random();

    /**
     * Simulates IoT sensor updates every 30 seconds.
     * Randomly toggles occupancy of 5-10 parking spaces.
     */
    /**
     * Simulates IoT sensor updates every 30 seconds.
     * Randomly toggles occupancy of 5-10 parking spaces.
     */
    // @Scheduled(fixedRate = 30000) // Every 30 seconds
    @Transactional
    public void simulateOccupancyChanges() {
        List<ParkingLot> lots = parkingLotRepository.findAll();
        if (lots.isEmpty()) {
            return;
        }

        // Pick 2-3 random lots to update
        int lotsToUpdate = Math.min(3, Math.max(2, lots.size() / 10));

        for (int i = 0; i < lotsToUpdate; i++) {
            ParkingLot lot = lots.get(random.nextInt(lots.size()));
            List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());

            if (spaces.isEmpty()) {
                continue;
            }

            // Toggle 1-5 random spaces
            int spacesToToggle = random.nextInt(5) + 1;
            for (int j = 0; j < Math.min(spacesToToggle, spaces.size()); j++) {
                ParkingSpace space = spaces.get(random.nextInt(spaces.size()));
                space.setOccupied(!space.isOccupied());
                parkingSpaceRepository.save(space);
            }

            // Broadcast the updated occupancy
            broadcastOccupancyUpdate(lot);
        }

        log.debug("Simulated occupancy changes for {} lots", lotsToUpdate);
    }

    /**
     * Broadcasts occupancy update for a specific parking lot via WebSocket.
     */
    public void broadcastOccupancyUpdate(ParkingLot lot) {
        List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());

        long occupiedCount = spaces.stream().filter(ParkingSpace::isOccupied).count();
        long totalCapacity = spaces.size();
        long availableSlots = totalCapacity - occupiedCount;
        double occupancyPercent = totalCapacity > 0 ? (double) occupiedCount / totalCapacity * 100 : 0;

        Map<String, Object> update = new HashMap<>();
        update.put("lotId", lot.getId());
        update.put("lotName", lot.getName());
        update.put("availableSlots", availableSlots);
        update.put("totalCapacity", totalCapacity);
        update.put("occupancyPercent", Math.round(occupancyPercent));
        update.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/parking/occupancy", update);
        log.debug("Broadcasted occupancy update for lot {}: {} available", lot.getName(), availableSlots);
    }

    /**
     * Broadcasts a price change alert via WebSocket.
     */
    public void broadcastPriceAlert(ParkingLot lot, double oldPrice, double newPrice) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("lotId", lot.getId());
        alert.put("lotName", lot.getName());
        alert.put("oldPrice", oldPrice);
        alert.put("newPrice", newPrice);
        alert.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/parking/price", alert);
        log.debug("Broadcasted price alert for lot {}: {} -> {}", lot.getName(), oldPrice, newPrice);
    }

    /**
     * Simulates dynamic price changes every 2 minutes based on occupancy.
     */
    /**
     * Simulates dynamic price changes every 2 minutes based on occupancy.
     */
    // @Scheduled(fixedRate = 120000) // Every 2 minutes
    @Transactional
    public void simulatePriceChanges() {
        List<ParkingLot> lots = parkingLotRepository.findAll();

        for (ParkingLot lot : lots) {
            List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());
            if (spaces.isEmpty())
                continue;

            long occupiedCount = spaces.stream().filter(ParkingSpace::isOccupied).count();
            double occupancyPercent = (double) occupiedCount / spaces.size() * 100;

            double oldPrice = lot.getBaseRate();
            double newPrice = oldPrice;

            // Apply dynamic pricing based on occupancy
            if (occupancyPercent > 90) {
                newPrice = oldPrice * 1.5; // 50% surge
            } else if (occupancyPercent > 75) {
                newPrice = oldPrice * 1.25; // 25% surge
            } else if (occupancyPercent < 30) {
                newPrice = oldPrice * 0.85; // 15% discount
            }

            // Cap the price
            newPrice = Math.max(15, Math.min(newPrice, 100));

            if (Math.abs(newPrice - oldPrice) > 1) {
                broadcastPriceAlert(lot, oldPrice, newPrice);
            }
        }
    }
}
