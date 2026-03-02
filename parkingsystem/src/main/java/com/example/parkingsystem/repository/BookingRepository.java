package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.Booking;
import com.example.parkingsystem.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);

    List<Booking> findByParkingSpaceIdAndEndTimeAfterAndStatus(Long spaceId, LocalDateTime time, BookingStatus status);

    List<Booking> findByStatusAndEndTimeBefore(BookingStatus status, LocalDateTime time);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b WHERE b.parkingSpace.id = :spaceId AND b.status = :status AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookings(Long spaceId, LocalDateTime startTime, LocalDateTime endTime,
            BookingStatus status);

    /**
     * Find overlapping bookings considering multiple statuses (ACTIVE and PENDING).
     * Used for advance booking overlap detection.
     */
    @org.springframework.data.jpa.repository.Query(
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
}
