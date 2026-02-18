package com.example.parkingsystem.service;

import com.example.parkingsystem.dto.BookingRequest;
import com.example.parkingsystem.entity.*;
import com.example.parkingsystem.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

        private final BookingRepository bookingRepository;
        private final ParkingSpaceRepository parkingSpaceRepository;
        private final UserRepository userRepository;
        private final PricingEngineService pricingEngineService;
        private final PaymentTransactionRepository paymentTransactionRepository;
        private final OccupancySimulatorService occupancyService;
        private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

        @Transactional(rollbackFor = Exception.class)
        public Booking createBooking(BookingRequest request, Long userId) {
                // 1. Fetch ParkingSpace with PESSIMISTIC LOCK to prevent double booking
                ParkingSpace space = parkingSpaceRepository.findByIdWithLock(request.getParkingSpaceId())
                                .orElseThrow(() -> new RuntimeException("Parking Space not found"));

                // 2. Check overlap (Double check logic, though lock prevents concurrent writes,
                // logical overlap exists)
                // Optimization: In real world, we query bookings table for overlap.
                // For simplicity: Check if space isOccupied flag matching current time?
                // Better: Check Booking table for overlaps.
                boolean isOverlapping = bookingRepository
                                .findByParkingSpaceIdAndEndTimeAfterAndStatus(space.getId(), request.getStartTime(),
                                                BookingStatus.ACTIVE)
                                .stream()
                                .anyMatch(b -> b.getStartTime().isBefore(request.getEndTime())
                                                && b.getEndTime().isAfter(request.getStartTime()));

                if (isOverlapping) {
                        throw new RuntimeException("Slot already booked for the selected time range");
                }

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // 3. Calculate Price
                double price = pricingEngineService.calculatePrice(space.getParkingLot(), space, user,
                                request.getStartTime(),
                                request.getEndTime());

                // 4. Create Booking
                Booking booking = Booking.builder()
                                .user(user)
                                .parkingSpace(space)
                                .startTime(request.getStartTime())
                                .endTime(request.getEndTime())
                                .status(BookingStatus.PENDING) // Pending payment
                                .totalAmount(price)
                                .build();

                return bookingRepository.save(booking);
        }

        @Transactional
        public Booking confirmBooking(Long bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                booking.setStatus(BookingStatus.ACTIVE);
                // Mark space occupied if currently active?
                // Usually space.isOccupied is for REAL-TIME status (sensor).
                // Bookings are future or current.

                return bookingRepository.save(booking);
        }

        @Transactional
        public void cancelBooking(Long bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() == BookingStatus.COMPLETED) {
                        throw new RuntimeException("Cannot cancel completed booking");
                }

                if (booking.getStatus() == BookingStatus.ACTIVE) {
                        // Free the space if it was active
                        ParkingSpace space = booking.getParkingSpace();
                        space.setOccupied(false);
                        parkingSpaceRepository.save(space);
                        occupancyService.broadcastOccupancyUpdate(space.getParkingLot());
                }

                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
        }

        /**
         * Lock a parking space temporarily while user completes payment.
         * Uses a simple in-memory lock map (for demo purposes).
         * In production, use Redis or database-based locking.
         */
        private static final java.util.concurrent.ConcurrentHashMap<Long, LockInfo> spaceLocks = new java.util.concurrent.ConcurrentHashMap<>();

        public boolean lockSpace(Long spaceId, Long userId, Integer durationSeconds) {
                ParkingSpace space = parkingSpaceRepository.findById(spaceId)
                                .orElseThrow(() -> new RuntimeException("Space not found"));

                // Check if space is already occupied
                if (space.isOccupied()) {
                        return false;
                }

                // Atomic check and set
                java.util.concurrent.atomic.AtomicBoolean success = new java.util.concurrent.atomic.AtomicBoolean(
                                false);

                spaceLocks.compute(spaceId, (k, existingLock) -> {
                        if (existingLock != null && existingLock.expiresAt.isAfter(LocalDateTime.now())
                                        && !existingLock.userId.equals(userId)) {
                                // Locked by someone else and active
                                success.set(false);
                                return existingLock;
                        }
                        // Lock available or expired or owned by same user
                        success.set(true);
                        return new LockInfo(userId, LocalDateTime.now().plusSeconds(durationSeconds));
                });

                if (success.get()) {
                        broadcastLockUpdate(spaceId, true);
                        return true;
                }
                return false;
        }

        public boolean unlockSpace(Long spaceId, Long userId) {
                LockInfo lock = spaceLocks.get(spaceId);
                if (lock == null) {
                        return true; // Already unlocked
                }
                if (lock.userId.equals(userId)) {
                        spaceLocks.remove(spaceId);
                        broadcastLockUpdate(spaceId, false);
                        return true;
                }
                return false; // Locked by another user
        }

        /**
         * Check if a space is currently locked.
         */
        public boolean isSpaceLocked(Long spaceId) {
                LockInfo lock = spaceLocks.get(spaceId);
                if (lock == null)
                        return false;
                if (lock.expiresAt.isBefore(LocalDateTime.now())) {
                        spaceLocks.remove(spaceId);
                        return false;
                }
                return true;
        }

        @Transactional(rollbackFor = Exception.class)
        public Booking createBookingWithPayment(Long userId, Long spaceId, Long lotId,
                        String vehicleNumber, LocalDateTime startTime, LocalDateTime endTime, Double totalAmount) {

                // Validate lock ownership
                LockInfo lock = spaceLocks.get(spaceId);
                if (lock == null || !lock.userId.equals(userId)) {
                        throw new RuntimeException("Space is not locked by this user. Please lock before booking.");
                }

                ParkingSpace space = parkingSpaceRepository.findByIdWithLock(spaceId)
                                .orElseThrow(() -> new RuntimeException("Parking Space not found"));

                // Validate overlaps
                boolean isOverlapping = bookingRepository
                                .findByParkingSpaceIdAndEndTimeAfterAndStatus(space.getId(), startTime,
                                                BookingStatus.ACTIVE)
                                .stream()
                                .anyMatch(b -> b.getStartTime().isBefore(endTime)
                                                && b.getEndTime().isAfter(startTime));

                if (isOverlapping) {
                        throw new RuntimeException("Slot already booked for the selected time range");
                }

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Create booking
                Booking booking = Booking.builder()
                                .user(user)
                                .parkingSpace(space)
                                .startTime(startTime)
                                .endTime(endTime)
                                .status(BookingStatus.ACTIVE)
                                .totalAmount(totalAmount)
                                .vehicleNumber(vehicleNumber)
                                .build();

                booking = bookingRepository.save(booking);

                // Mark space as occupied ONLY if the booking starts roughly now (e.g., within 5
                // minutes)
                // This allows advance payment without blocking the physical sensor status
                // immediately
                if (startTime.isBefore(LocalDateTime.now().plusMinutes(5))) {
                        space.setOccupied(true);
                        parkingSpaceRepository.save(space);
                        // Broadcast occupancy update
                        occupancyService.broadcastOccupancyUpdate(space.getParkingLot());
                }

                // Remove the lock
                spaceLocks.remove(spaceId);
                broadcastLockUpdate(spaceId, false);

                // Increment user's completed bookings for loyalty pricing
                user.setCompletedBookings(user.getCompletedBookings() + 1);
                userRepository.save(user);

                return booking;
        }

        /**
         * Get all bookings for a specific user.
         */
        public java.util.List<Booking> getUserBookings(Long userId) {
                return bookingRepository.findByUserId(userId);
        }

        public List<Booking> checkAndCompleteExpiredBookings() {
                LocalDateTime now = LocalDateTime.now();
                List<Booking> expiredBookings = bookingRepository.findByStatusAndEndTimeBefore(BookingStatus.ACTIVE,
                                now);

                for (Booking booking : expiredBookings) {
                        booking.setStatus(BookingStatus.COMPLETED);
                        ParkingSpace space = booking.getParkingSpace();
                        space.setOccupied(false);
                        parkingSpaceRepository.save(space);
                }

                if (!expiredBookings.isEmpty()) {
                        bookingRepository.saveAll(expiredBookings);
                }

                return expiredBookings;
        }

        @Transactional
        public List<Booking> activateStartingBookings() {
                try {
                        LocalDateTime now = LocalDateTime.now();
                        // Find active bookings that have started but space is not yet marked occupied
                        List<Booking> startingBookings = bookingRepository.findByStatus(BookingStatus.ACTIVE).stream()
                                        .filter(b -> b.getStartTime().isBefore(now) && b.getEndTime().isAfter(now))
                                        .filter(b -> !b.getParkingSpace().isOccupied())
                                        .toList();

                        for (Booking booking : startingBookings) {
                                ParkingSpace space = booking.getParkingSpace();
                                space.setOccupied(true);
                                parkingSpaceRepository.save(space);
                                occupancyService.broadcastOccupancyUpdate(space.getParkingLot());
                        }
                        return startingBookings;
                } catch (Exception e) {
                        System.err.println("Error activating starting bookings: " + e.getMessage());
                        e.printStackTrace();
                        return List.of();
                }
        }

        @Transactional
        public Booking completeBookingByVehicle(String vehicleNumber) {
                Booking booking = bookingRepository.findByVehicleNumberAndStatus(vehicleNumber, BookingStatus.ACTIVE)
                                .orElseThrow(() -> new RuntimeException(
                                                "No active booking found for vehicle: " + vehicleNumber));

                booking.setStatus(BookingStatus.COMPLETED);

                ParkingSpace space = booking.getParkingSpace();
                space.setOccupied(false);
                parkingSpaceRepository.save(space);

                // Broadcast occupancy update
                occupancyService.broadcastOccupancyUpdate(space.getParkingLot());

                return bookingRepository.save(booking);
        }

        /**
         * Simple lock info record.
         */
        private record LockInfo(Long userId, LocalDateTime expiresAt) {
        }

        private void broadcastLockUpdate(Long spaceId, boolean isLocked) {
                java.util.Map<String, Object> update = new java.util.HashMap<>();
                update.put("spaceId", spaceId);
                update.put("isLocked", isLocked);
                messagingTemplate.convertAndSend("/topic/parking/locks", update);
        }

        @Transactional
        public Booking extendBooking(Long bookingId, Integer extraHours) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != BookingStatus.ACTIVE && booking.getStatus() != BookingStatus.PENDING) {
                        throw new RuntimeException("Cannot extend a completed or cancelled booking");
                }

                LocalDateTime currentEndTime = booking.getEndTime();
                LocalDateTime newEndTime = currentEndTime.plusHours(extraHours);

                // Check for overlaps in the extension period
                boolean isOverlapping = bookingRepository.findOverlappingBookings(
                                booking.getParkingSpace().getId(),
                                currentEndTime, // Check from current end time
                                newEndTime,
                                BookingStatus.ACTIVE).stream()
                                .anyMatch(b -> !b.getId().equals(bookingId)); // Should not match self anyway, but good
                                                                              // safety

                if (isOverlapping) {
                        throw new RuntimeException(
                                        "Slot is booked by someone else during the requested extension time");
                }

                // Recalculate price
                User user = booking.getUser();
                ParkingSpace space = booking.getParkingSpace();
                double newTotal = pricingEngineService.calculatePrice(space.getParkingLot(), space, user,
                                booking.getStartTime(), newEndTime);

                booking.setEndTime(newEndTime);
                booking.setTotalAmount(newTotal);

                return bookingRepository.save(booking);
        }
}
