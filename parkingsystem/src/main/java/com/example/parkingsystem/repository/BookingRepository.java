package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByParkingSpaceIdAndEndTimeAfterAndStatus(Long spaceId, LocalDateTime time, BookingStatus status);

    List<Booking> findByStatusAndEndTimeBefore(BookingStatus status, LocalDateTime time);

    @Query("SELECT b FROM Booking b WHERE b.parkingSpace.id = :spaceId AND b.status = :status AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookings(Long spaceId, LocalDateTime startTime, LocalDateTime endTime,
            BookingStatus status);

    @Query(
        "SELECT b FROM Booking b WHERE b.parkingSpace.id = :spaceId " +
        "AND b.status IN :statuses " +
        "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookingsWithStatuses(
            Long spaceId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            List<BookingStatus> statuses);

    java.util.Optional<Booking> findByVehicleNumberAndStatus(String vehicleNumber, BookingStatus status);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByParkingSpace_ParkingLot_Id(Long parkingLotId);

    List<Booking> findByParkingSpaceId(Long spaceId);

    List<Booking> findByParkingSpace_ParkingLot_OwnerId(Long ownerId);

    // ── NEW: needed by BookingNotificationScheduler ──────────────────────────

    /**
     * Find bookings with given status whose startTime falls in [from, to].
     * Used to detect bookings that just started.
     */
    List<Booking> findByStatusAndStartTimeBetween(BookingStatus status,
                                                   LocalDateTime from,
                                                   LocalDateTime to);

    /**
     * Find bookings with given status whose endTime falls in [from, to].
     * Used to detect bookings that just ended or are expiring soon.
     */
    List<Booking> findByStatusAndEndTimeBetween(BookingStatus status,
                                                 LocalDateTime from,
                                                 LocalDateTime to);
}