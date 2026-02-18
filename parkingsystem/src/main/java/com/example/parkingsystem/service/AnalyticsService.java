package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.entity.BookingStatus;
import com.example.parkingsystem.repository.BookingRepository;
import com.example.parkingsystem.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final ParkingLotRepository parkingLotRepository;

    public Map<String, Object> getCityWideStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalLots = parkingLotRepository.count();
        stats.put("totalLots", totalLots);

        // Mock revenue aggregation
        List<Booking> completedBookings = bookingRepository.findAll();
        double totalRevenue = completedBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .mapToDouble(Booking::getTotalAmount)
                .sum();

        stats.put("totalRevenue", totalRevenue);
        return stats;
    }

    public Map<String, Object> getLotManagerStats(Long lotId) {
        Map<String, Object> stats = new HashMap<>();

        // Basic Lot Info
        var lot = parkingLotRepository.findById(lotId).orElseThrow(() -> new RuntimeException("Lot not found"));
        stats.put("lotName", lot.getName());
        stats.put("totalCapacity", lot.getTotalCapacity());

        // Bookings for this lot
        List<Booking> lotBookings = bookingRepository.findByParkingSpace_ParkingLot_Id(lotId);

        // Today's Revenue
        double todayRevenue = lotBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED
                        && b.getEndTime().toLocalDate().isEqual(java.time.LocalDate.now()))
                .mapToDouble(Booking::getTotalAmount)
                .sum();

        // Total Active Bookings (Occupancy estimate if not using spaces directly)
        long currentOccupancy = lot.getSpaces().stream().filter(space -> space.isOccupied()).count();

        stats.put("todayRevenue", todayRevenue);
        stats.put("occupiedSpaces", currentOccupancy);
        stats.put("occupancyPercent",
                lot.getTotalCapacity() > 0 ? (currentOccupancy * 100 / lot.getTotalCapacity()) : 0);

        return stats;
    }

    // Additional methods for Lot Manager Dashboard could be added here
}
