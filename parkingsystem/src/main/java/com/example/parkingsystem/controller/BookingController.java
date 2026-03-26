package com.example.parkingsystem.controller;

import com.example.parkingsystem.dto.BookingRequest;
import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.security.UserDetailsImpl;
import com.example.parkingsystem.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/reserve")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> reserveParking(@RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            // If user is admin but wants to book for self, or maybe passing user id in
            // request?
            // For now, use the authenticated user's ID
            Long userId = userDetails.getId();
            Booking booking = bookingService.createBooking(request, userId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.confirmBooking(id);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            bookingService.cancelBooking(id);
            return ResponseEntity.ok("Booking cancelled successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/extend")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> extendBooking(@PathVariable Long id, @RequestBody java.util.Map<String, Object> request) {
        try {
            Integer extraHours = request.get("extraHours") != null
                    ? Integer.valueOf(request.get("extraHours").toString())
                    : 1;
            Booking booking = bookingService.extendBooking(id, extraHours);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<Booking>> getUserBookings(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<Booking> bookings = bookingService.getUserBookings(userDetails.getId());
        return ResponseEntity.ok(bookings);
    }

    /**
     * Lock a parking space temporarily for payment.
     */
    @PostMapping("/lock")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> lockSpace(@RequestBody java.util.Map<String, Object> request) {
        try {
            Long spaceId = Long.valueOf(request.get("spaceId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            Integer duration = request.get("duration") != null
                    ? Integer.valueOf(request.get("duration").toString())
                    : 300;

            boolean locked = bookingService.lockSpace(spaceId, userId, duration);

            if (locked) {
                return ResponseEntity.ok(java.util.Map.of(
                        "success", true,
                        "message", "Space locked successfully",
                        "spaceId", spaceId,
                        "expiresIn", duration));
            } else {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                        "success", false,
                        "message", "Space is already locked or occupied"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Unlock a previously locked parking space.
     */
    @PostMapping("/unlock")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> unlockSpace(@RequestBody java.util.Map<String, Object> request) {
        try {
            Long spaceId = Long.valueOf(request.get("spaceId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());

            boolean unlocked = bookingService.unlockSpace(spaceId, userId);

            return ResponseEntity.ok(java.util.Map.of(
                    "success", unlocked,
                    "message", unlocked ? "Space unlocked" : "Could not unlock space"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Create a new booking after successful payment.
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('DRIVER') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> createBooking(@RequestBody java.util.Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long spaceId = Long.valueOf(request.get("spaceId").toString());
            Long lotId = Long.valueOf(request.get("lotId").toString());
            String vehicleNumber = (String) request.get("vehicleNumber");
            Double totalAmount = Double.valueOf(request.get("totalAmount").toString());

            java.time.LocalDateTime startTime;
            java.time.LocalDateTime endTime;

            if (request.get("startTime") != null && request.get("endTime") != null) {
                startTime = java.time.LocalDateTime.parse(request.get("startTime").toString());
                endTime = java.time.LocalDateTime.parse(request.get("endTime").toString());
            } else {
                // Fallback for backward compatibility or simple duration-based requests
                Integer durationHours = Integer.valueOf(request.get("durationHours").toString());
                startTime = java.time.LocalDateTime.now();
                endTime = startTime.plusHours(durationHours);
            }

            String paymentMethod = request.get("paymentMethod") != null
                    ? request.get("paymentMethod").toString()
                    : null;

            Booking booking = bookingService.createBookingWithPayment(
                    userDetails.getId(), spaceId, lotId, vehicleNumber, startTime, endTime, totalAmount, paymentMethod);

            return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "bookingId", booking.getId(),
                    "message", "Booking created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Mark booking as completed when vehicle exits.
     */
    @PostMapping("/exit")
    public ResponseEntity<?> exitGate(@RequestBody java.util.Map<String, String> request) {
        try {
            String vehicleNumber = request.get("vehicleNumber");
            if (vehicleNumber == null || vehicleNumber.trim().isEmpty()) {
                throw new IllegalArgumentException("Vehicle number is required");
            }

            Booking booking = bookingService.completeBookingByVehicle(vehicleNumber);

            return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "message", "Vehicle exit recorded. Booking completed.",
                    "bookingId", booking.getId(),
                    "totalAmount", booking.getTotalAmount()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }
}
