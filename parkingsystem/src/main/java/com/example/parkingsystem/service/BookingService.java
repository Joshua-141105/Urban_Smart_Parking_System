// ─────────────────────────────────────────────────────────────────
// PATCH: Add these changes to BookingService.java
//
// 1. Inject NotificationService (add to constructor via @RequiredArgsConstructor)
// 2. Call notificationService.notifyBookingCreated() after saving booking
// ─────────────────────────────────────────────────────────────────

// ADD this field alongside the existing ones:
//   private final NotificationService notificationService;

// In createBookingWithPayment(), AFTER "booking = bookingRepository.save(booking);"
// ADD these lines (before the spaceLocks.remove call):

/*
    // Notify user that booking was created successfully
    try {
        String lotName = space.getParkingLot().getName();
        notificationService.notifyBookingCreated(userId, booking.getId(), lotName);
    } catch (Exception e) {
        // Non-critical: log but don't fail the booking
        log.warn("Failed to create booking notification: {}", e.getMessage());
    }
*/

// In createOfflineBooking(), AFTER "booking = bookingRepository.save(booking);"
// ADD:
/*
    try {
        String lotName = space.getParkingLot().getName();
        notificationService.notifyBookingCreated(adminUserId, booking.getId(), lotName);
    } catch (Exception e) {
        log.warn("Failed to create offline booking notification: {}", e.getMessage());
    }
*/

// ─────────────────────────────────────────────────────────────────
// COMPLETE createBookingWithPayment method with notification added:
// ─────────────────────────────────────────────────────────────────

package com.example.parkingsystem.service;

import com.example.parkingsystem.dto.BookingRequest;
import com.example.parkingsystem.entity.*;
import com.example.parkingsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingSpaceRepository parkingSpaceRepository;
    private final UserRepository userRepository;
    private final PricingEngineService pricingEngineService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OccupancySimulatorService occupancyService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    // NEW: inject NotificationService
    private final NotificationService notificationService;

    // ── All existing methods preserved exactly ──────────────────────────────

    @Transactional(rollbackFor = Exception.class)
    public Booking createBooking(BookingRequest request, Long userId) {
        ParkingSpace space = parkingSpaceRepository.findByIdWithLock(request.getParkingSpaceId())
                .orElseThrow(() -> new RuntimeException("Parking Space not found"));

        List<BookingStatus> blockingStatuses = List.of(BookingStatus.ACTIVE, BookingStatus.PENDING);
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookingsWithStatuses(
                space.getId(), request.getStartTime(), request.getEndTime(), blockingStatuses);

        if (!overlappingBookings.isEmpty()) {
            throw new RuntimeException("Slot already booked or reserved for the selected time range");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        double price = pricingEngineService.calculatePrice(space.getParkingLot(), space, user,
                request.getStartTime(), request.getEndTime());

        Booking booking = Booking.builder()
                .user(user)
                .parkingSpace(space)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(BookingStatus.PENDING)
                .totalAmount(price)
                .build();

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.ACTIVE);
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
            ParkingSpace space = booking.getParkingSpace();
            space.setOccupied(false);
            parkingSpaceRepository.save(space);
            occupancyService.broadcastOccupancyUpdate(space.getParkingLot());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    private static final java.util.concurrent.ConcurrentHashMap<Long, LockInfo> spaceLocks =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static final int REALTIME_LOCK_DURATION_SECONDS = 60;
    private static final int ADVANCE_LOCK_DURATION_SECONDS = 180;
    private static final int REALTIME_THRESHOLD_MINUTES = 5;

    public boolean lockSpace(Long spaceId, Long userId, Integer durationSeconds) {
        return lockSpaceInternal(spaceId, userId, durationSeconds);
    }

    public boolean lockSpaceForBooking(Long spaceId, Long userId, LocalDateTime startTime) {
        int lockDuration = calculateLockDuration(startTime);
        return lockSpaceInternal(spaceId, userId, lockDuration);
    }

    private int calculateLockDuration(LocalDateTime startTime) {
        if (startTime == null) return REALTIME_LOCK_DURATION_SECONDS;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime realtimeThreshold = now.plusMinutes(REALTIME_THRESHOLD_MINUTES);
        return startTime.isBefore(realtimeThreshold) ? REALTIME_LOCK_DURATION_SECONDS : ADVANCE_LOCK_DURATION_SECONDS;
    }

    private boolean lockSpaceInternal(Long spaceId, Long userId, Integer durationSeconds) {
        ParkingSpace space = parkingSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));

        if (space.isOccupied()) return false;

        java.util.concurrent.atomic.AtomicBoolean success = new java.util.concurrent.atomic.AtomicBoolean(false);
        spaceLocks.compute(spaceId, (k, existingLock) -> {
            if (existingLock != null && existingLock.expiresAt.isAfter(LocalDateTime.now())
                    && !existingLock.userId.equals(userId)) {
                success.set(false);
                return existingLock;
            }
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
        if (lock == null) return true;
        if (lock.userId.equals(userId)) {
            spaceLocks.remove(spaceId);
            broadcastLockUpdate(spaceId, false);
            return true;
        }
        return false;
    }

    public boolean isSpaceLocked(Long spaceId) {
        LockInfo lock = spaceLocks.get(spaceId);
        if (lock == null) return false;
        if (lock.expiresAt.isBefore(LocalDateTime.now())) {
            spaceLocks.remove(spaceId);
            return false;
        }
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public Booking createBookingWithPayment(Long userId, Long spaceId, Long lotId,
            String vehicleNumber, LocalDateTime startTime, LocalDateTime endTime, Double totalAmount) {

        LockInfo lock = spaceLocks.get(spaceId);
        if (lock == null || !lock.userId.equals(userId)) {
            throw new RuntimeException("Space is not locked by this user. Please lock before booking.");
        }

        ParkingSpace space = parkingSpaceRepository.findByIdWithLock(spaceId)
                .orElseThrow(() -> new RuntimeException("Parking Space not found"));

        List<BookingStatus> blockingStatuses = List.of(BookingStatus.ACTIVE, BookingStatus.PENDING);
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookingsWithStatuses(
                space.getId(), startTime, endTime, blockingStatuses);

        if (!overlappingBookings.isEmpty()) {
            throw new RuntimeException("Slot already booked or reserved for the selected time range");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

        if (startTime.isBefore(LocalDateTime.now().plusMinutes(5))) {
            space.setOccupied(true);
            parkingSpaceRepository.save(space);
            occupancyService.broadcastOccupancyUpdate(space.getParkingLot());
        }

        spaceLocks.remove(spaceId);
        broadcastLockUpdate(spaceId, false);

        user.setCompletedBookings(user.getCompletedBookings() + 1);
        userRepository.save(user);

        // NEW: notify user of successful booking
        try {
            String lotName = space.getParkingLot().getName();
            notificationService.notifyBookingCreated(userId, booking.getId(), lotName);
        } catch (Exception e) {
            log.warn("Failed to send booking-created notification: {}", e.getMessage());
        }

        return booking;
    }

    public java.util.List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> checkAndCompleteExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findByStatusAndEndTimeBefore(BookingStatus.ACTIVE, now);

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
            log.error("Error activating starting bookings: {}", e.getMessage());
            return List.of();
        }
    }

    @Transactional
    public Booking completeBookingByVehicle(String vehicleNumber) {
        Booking booking = bookingRepository.findByVehicleNumberAndStatus(vehicleNumber, BookingStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active booking found for vehicle: " + vehicleNumber));

        booking.setStatus(BookingStatus.COMPLETED);
        ParkingSpace space = booking.getParkingSpace();
        space.setOccupied(false);
        parkingSpaceRepository.save(space);
        occupancyService.broadcastOccupancyUpdate(space.getParkingLot());

        return bookingRepository.save(booking);
    }

    @Transactional(rollbackFor = Exception.class)
    public Booking createOfflineBooking(Long adminUserId, Long spaceId, Long lotId,
            String vehicleNumber, Integer durationHours) {

        ParkingSpace space = parkingSpaceRepository.findByIdWithLock(spaceId)
                .orElseThrow(() -> new RuntimeException("Parking Space not found"));

        if (!space.getParkingLot().getId().equals(lotId)) {
            throw new RuntimeException("Space does not belong to the specified lot");
        }

        if (space.isOccupied()) {
            throw new RuntimeException("Space is already occupied");
        }

        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = startTime.plusHours(durationHours);

        List<BookingStatus> blockingStatuses = List.of(BookingStatus.ACTIVE, BookingStatus.PENDING);
        List<Booking> overlapping = bookingRepository.findOverlappingBookingsWithStatuses(
                space.getId(), startTime, endTime, blockingStatuses);

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Slot already booked for the selected time range");
        }

        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        double price = pricingEngineService.calculatePrice(
                space.getParkingLot(), space, adminUser, startTime, endTime);

        Booking booking = Booking.builder()
                .user(adminUser)
                .parkingSpace(space)
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.ACTIVE)
                .totalAmount(price)
                .vehicleNumber(vehicleNumber)
                .build();

        booking = bookingRepository.save(booking);

        space.setOccupied(true);
        parkingSpaceRepository.save(space);
        occupancyService.broadcastOccupancyUpdate(space.getParkingLot());

        // NEW: notify for offline booking too
        try {
            String lotName = space.getParkingLot().getName();
            notificationService.notifyBookingCreated(adminUserId, booking.getId(), lotName);
        } catch (Exception e) {
            log.warn("Failed to send offline booking notification: {}", e.getMessage());
        }

        return booking;
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

        boolean isOverlapping = bookingRepository.findOverlappingBookings(
                booking.getParkingSpace().getId(), currentEndTime, newEndTime, BookingStatus.ACTIVE)
                .stream().anyMatch(b -> !b.getId().equals(bookingId));

        if (isOverlapping) {
            throw new RuntimeException("Slot is booked by someone else during the requested extension time");
        }

        User user = booking.getUser();
        ParkingSpace space = booking.getParkingSpace();
        double newTotal = pricingEngineService.calculatePrice(space.getParkingLot(), space, user,
                booking.getStartTime(), newEndTime);

        booking.setEndTime(newEndTime);
        booking.setTotalAmount(newTotal);

        return bookingRepository.save(booking);
    }

    private record LockInfo(Long userId, LocalDateTime expiresAt) {}

    private void broadcastLockUpdate(Long spaceId, boolean isLocked) {
        java.util.Map<String, Object> update = new java.util.HashMap<>();
        update.put("spaceId", spaceId);
        update.put("isLocked", isLocked);
        messagingTemplate.convertAndSend("/topic/parking/locks", update);
    }
}