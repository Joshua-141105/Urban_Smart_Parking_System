package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.entity.ParkingSpace;
import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.MonthlyPermitRepository;
import com.example.parkingsystem.repository.ParkingSpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingEngineService {

    private final ParkingSpaceRepository parkingSpaceRepository;
    private final MonthlyPermitRepository permitRepository;

    private static final double MIN_PRICE_PER_HOUR = 20.0;
    private static final double MAX_PRICE_PER_HOUR = 150.0;
    private static final double MONTHLY_PERMIT_PRICE = 500.0;

    private static final Set<LocalDate> HOLIDAY_DATES = Set.of(
            LocalDate.of(2026, Month.JANUARY, 26), 
            LocalDate.of(2026, Month.AUGUST, 15), 
            LocalDate.of(2026, Month.OCTOBER, 2), 
            LocalDate.of(2026, Month.NOVEMBER, 1), 
            LocalDate.of(2026, Month.DECEMBER, 25) 
    );

    public double calculatePrice(ParkingLot lot, ParkingSpace space, User user, LocalDateTime start,
            LocalDateTime end) {
        double baseRate = lot.getBaseRate();

        if (user != null && hasMonthlyPermit(user, lot)) {
            log.debug("User {} has monthly permit, returning 0", user.getUsername());
            return 0.0;
        }

        double occupancyMultiplier = calculateOccupancyMultiplier(lot);
        double timeMultiplier = calculateTimeMultiplier(start);
        double userMultiplier = calculateUserMultiplier(user);
        double holidayMultiplier = calculateHolidayMultiplier(start);

        long minutes = Duration.between(start, end).toMinutes();
        double hours = Math.ceil(minutes / 60.0);
        if (hours < 1.0)
            hours = 1.0;
        double hourlyRate = baseRate * occupancyMultiplier * timeMultiplier * userMultiplier * holidayMultiplier;

        hourlyRate = Math.max(hourlyRate, MIN_PRICE_PER_HOUR);
        hourlyRate = Math.min(hourlyRate, MAX_PRICE_PER_HOUR);

        double finalPrice = hourlyRate * hours;

        log.debug("Price calculation: base={}, hours={}, occ={}, time={}, user={}, holiday={}, final={}",
                baseRate, hours, occupancyMultiplier, timeMultiplier, userMultiplier, holidayMultiplier, finalPrice);

        return Math.round(finalPrice * 100.0) / 100.0; 
    }
    public double calculateHourlyRate(ParkingLot lot, User user, LocalDateTime time) {
        double baseRate = lot.getBaseRate();

        if (user != null && hasMonthlyPermit(user, lot)) {
            return 0.0; 
        }

        double occupancyMultiplier = calculateOccupancyMultiplier(lot);
        double timeMultiplier = calculateTimeMultiplier(time);
        double userMultiplier = calculateUserMultiplier(user);
        double holidayMultiplier = calculateHolidayMultiplier(time);

        double hourlyRate = baseRate * occupancyMultiplier * timeMultiplier * userMultiplier * holidayMultiplier;

        hourlyRate = Math.max(hourlyRate, MIN_PRICE_PER_HOUR);
        hourlyRate = Math.min(hourlyRate, MAX_PRICE_PER_HOUR);

        return Math.round(hourlyRate * 100.0) / 100.0;
    }

    /**
     * OCCUPANCY_MULTIPLIER based on lot fill percentage:
     * - 0-30%: 0.7x (off-peak discount)
     * - 30-60%: 1.0x (normal rate)
     * - 60-80%: 1.3x (demand rising)
     * - 80-90%: 1.6x (high demand)
     * - 90-95%: 2.0x (premium pricing)
     * - 95%+: 2.5x (surge pricing)
     */
    private double calculateOccupancyMultiplier(ParkingLot lot) {
        if (lot.getTotalCapacity() == 0)
            return 1.0;

        // Get actual occupancy from parking spaces
        List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());
        if (spaces.isEmpty())
            return 1.0;

        long occupiedCount = spaces.stream().filter(ParkingSpace::isOccupied).count();
        double occupancyPercent = (double) occupiedCount / spaces.size() * 100;

        if (occupancyPercent < 30) {
            return 0.7; // Off-peak discount
        } else if (occupancyPercent < 60) {
            return 1.0; // Normal rate
        } else if (occupancyPercent < 80) {
            return 1.3; // Demand rising
        } else if (occupancyPercent < 90) {
            return 1.6; // High demand
        } else if (occupancyPercent < 95) {
            return 2.0; // Premium pricing
        } else {
            return 2.5; // Surge pricing - last spots
        }
    }

    /**
     * TIME_MULTIPLIER based on time of day and day of week:
     * - Peak hours (8-10 AM, 12-2 PM, 5-7 PM): 1.5x
     * - Off-peak (7 PM - 8 AM): 0.5x
     * - Night (11 PM - 6 AM): 0.8x
     * - Weekend morning (6 AM - 12 PM): 0.9x
     * - Weekend evening (12-7 PM): 1.0x
     */
    private double calculateTimeMultiplier(LocalDateTime dateTime) {
        int hour = dateTime.getHour();
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        boolean isWeekend = (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY);

        if (isWeekend) {
            if (hour >= 6 && hour < 12) {
                return 0.9; // Weekend morning
            } else if (hour >= 12 && hour < 19) {
                return 1.0; // Weekend evening
            }
        }

        // Night hours (11 PM - 6 AM)
        if (hour >= 23 || hour < 6) {
            return 0.8;
        }

        // Peak hours
        if ((hour >= 8 && hour < 10) || // Morning peak
                (hour >= 12 && hour < 14) || // Lunch peak
                (hour >= 17 && hour < 19)) { // Evening peak
            return 1.5;
        }

        // Off-peak (7 PM - 8 AM except night)
        if (hour >= 19 || hour < 8) {
            return 0.5;
        }

        // Regular hours
        return 1.0;
    }

    /**
     * USER_MULTIPLIER based on visit frequency (loyalty):
     * - New user (0-4 visits): 1.0x
     * - 5-20 visits: 0.95x (5% discount)
     * - 21-50 visits: 0.90x (10% discount)
     * - 51+ visits: 0.85x (15% discount)
     */
    private double calculateUserMultiplier(User user) {
        if (user == null) {
            return 1.0; // Guest user
        }

        // Get completed booking count from user
        // Assuming User entity has a method or we query bookings
        int visitCount = user.getCompletedBookings() != null ? user.getCompletedBookings() : 0;

        if (visitCount >= 51) {
            return 0.85; // 15% discount
        } else if (visitCount >= 21) {
            return 0.90; // 10% discount
        } else if (visitCount >= 5) {
            return 0.95; // 5% discount
        } else {
            return 1.0; // New user
        }
    }

    /**
     * HOLIDAY_MULTIPLIER for special seasonal pricing:
     * - Holiday dates: 1.3x
     */
    private double calculateHolidayMultiplier(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();
        if (HOLIDAY_DATES.contains(date)) {
            return 1.3; // Holiday surge
        }
        return 1.0;
    }

    /**
     * Check if user has active monthly permit.
     */
    private boolean hasMonthlyPermit(User user, ParkingLot lot) {
        return permitRepository.findActivePermit(user.getId(), lot.getId(), LocalDateTime.now()).isPresent();
    }

    public PriceBreakdown getPriceBreakdown(ParkingLot lot, User user, LocalDateTime start, LocalDateTime end) {
        double baseRate = lot.getBaseRate();
        double occupancyMultiplier = calculateOccupancyMultiplier(lot);
        double timeMultiplier = calculateTimeMultiplier(start);
        double userMultiplier = calculateUserMultiplier(user);
        double holidayMultiplier = calculateHolidayMultiplier(start);

        long minutes = Duration.between(start, end).toMinutes();
        double hours = Math.ceil(minutes / 60.0);
        if (hours < 1.0)
            hours = 1.0;

        double rawHourlyRate = baseRate * occupancyMultiplier * timeMultiplier * userMultiplier * holidayMultiplier;
        double cappedHourlyRate = Math.max(Math.min(rawHourlyRate, MAX_PRICE_PER_HOUR), MIN_PRICE_PER_HOUR);
        double totalPrice = cappedHourlyRate * hours;

        return new PriceBreakdown(
                baseRate,
                occupancyMultiplier,
                timeMultiplier,
                userMultiplier,
                holidayMultiplier,
                hours,
                cappedHourlyRate,
                Math.round(totalPrice * 100.0) / 100.0);
    }

    /**
     * Price breakdown record for API response.
     */
    public record PriceBreakdown(
            double baseRate,
            double occupancyMultiplier,
            double timeMultiplier,
            double userMultiplier,
            double holidayMultiplier,
            double hours,
            double hourlyRate,
            double totalPrice) {
    }
}
