package com.example.parkingsystem.scheduler;

import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.entity.BookingStatus;
import com.example.parkingsystem.repository.BookingRepository;
import com.example.parkingsystem.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Runs every 60 seconds to check booking lifecycle events and
 * push corresponding notifications to users.
 *
 * EVENTS HANDLED:
 *  1. Booking start reached    → "Your parking session has started"
 *  2. Booking end reached      → "Thank you for parking with us"
 *  3. Booking expiring in 15m  → "Your parking expires in 15 minutes"
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    /**
     * Every 60 seconds: check for bookings whose start time was just reached.
     * Window: startTime between (now - 2 min) and (now + 1 min) to handle slight delays.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional(readOnly = true)
    public void notifyBookingStarted() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(2);
        LocalDateTime windowEnd = now.plusMinutes(1);

        List<Booking> startingBookings = bookingRepository
                .findByStatusAndStartTimeBetween(BookingStatus.ACTIVE, windowStart, windowEnd);

        for (Booking booking : startingBookings) {
            try {
                String lotName = booking.getParkingSpace().getParkingLot().getName();
                Long userId = booking.getUser().getId();

                notificationService.notifyBookingStarted(userId, booking.getId(), lotName);
                log.info("Session-started notification sent: bookingId={}, userId={}", booking.getId(), userId);
            } catch (Exception e) {
                log.error("Error sending start notification for bookingId={}: {}", booking.getId(), e.getMessage());
            }
        }
    }

    /**
     * Every 60 seconds: check for bookings that ended in the last 2 minutes.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional(readOnly = true)
    public void notifyBookingEnded() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(2);
        LocalDateTime windowEnd = now.plusMinutes(1);

        // Completed by scheduler OR just crossed end time while ACTIVE
        List<Booking> endedBookings = bookingRepository
                .findByStatusAndEndTimeBetween(BookingStatus.COMPLETED, windowStart, windowEnd);

        // Also catch ACTIVE bookings whose end time just passed (before scheduler completes them)
        List<Booking> overdueActive = bookingRepository
                .findByStatusAndEndTimeBetween(BookingStatus.ACTIVE, windowStart, windowEnd);
        endedBookings.addAll(overdueActive);

        for (Booking booking : endedBookings) {
            try {
                String lotName = booking.getParkingSpace().getParkingLot().getName();
                Long userId = booking.getUser().getId();

                notificationService.notifyBookingEnded(userId, booking.getId(), lotName);
                log.info("Session-ended notification sent: bookingId={}, userId={}", booking.getId(), userId);
            } catch (Exception e) {
                log.error("Error sending end notification for bookingId={}: {}", booking.getId(), e.getMessage());
            }
        }
    }

    /**
     * Every 60 seconds: warn users whose booking expires in ~15 minutes.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional(readOnly = true)
    public void notifyExpiringSoon() {
        LocalDateTime now = LocalDateTime.now();
        // Window: endTime between 14 and 16 minutes from now
        LocalDateTime windowStart = now.plusMinutes(14);
        LocalDateTime windowEnd = now.plusMinutes(16);

        List<Booking> expiringBookings = bookingRepository
                .findByStatusAndEndTimeBetween(BookingStatus.ACTIVE, windowStart, windowEnd);

        for (Booking booking : expiringBookings) {
            try {
                String lotName = booking.getParkingSpace().getParkingLot().getName();
                Long userId = booking.getUser().getId();

                notificationService.notifyBookingExpiringSoon(userId, booking.getId(), lotName, 15);
                log.info("Expiry warning notification sent: bookingId={}, userId={}", booking.getId(), userId);
            } catch (Exception e) {
                log.error("Error sending expiry notification for bookingId={}: {}", booking.getId(), e.getMessage());
            }
        }
    }
}