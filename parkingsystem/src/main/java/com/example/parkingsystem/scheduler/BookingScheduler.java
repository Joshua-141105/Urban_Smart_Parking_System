package com.example.parkingsystem.scheduler;

import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final BookingService bookingService;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 60000) // Run every minute
    public void checkExpiredBookings() {
        log.info("Checking for expired bookings...");
        List<Booking> completedBookings = bookingService.checkAndCompleteExpiredBookings();

        for (Booking booking : completedBookings) {
            log.info("Booking {} expired. Notifying user {}", booking.getId(), booking.getUser().getId());

            // Notify the specific user
            messagingTemplate.convertAndSend(
                    "/topic/user/" + booking.getUser().getId() + "/bookings",
                    booking);
        }

        // Check for starting bookings
        bookingService.activateStartingBookings();
    }
}
