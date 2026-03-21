package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.ParkingSpace;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSpaceRepository extends JpaRepository<ParkingSpace, Long> {

    List<ParkingSpace> findByParkingLotId(Long parkingLotId);

    long countByParkingLotIdAndIsOccupiedTrue(Long parkingLotId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ParkingSpace p WHERE p.id = :id")
    Optional<ParkingSpace> findByIdWithLock(@Param("id") Long id);

    /**
     * Find all available parking spaces for a given time range.
     * A space is available if:
     * - It is not under maintenance
     * - There are no overlapping ACTIVE or PENDING bookings for the requested time range
     * 
     * Overlap condition: existing.startTime < requestedEndTime AND existing.endTime > requestedStartTime
     */
    @Query("""
            SELECT ps FROM ParkingSpace ps 
            WHERE ps.parkingLot.id = :lotId 
            AND ps.isMaintenance = false
            AND NOT EXISTS (
                SELECT b FROM Booking b 
                WHERE b.parkingSpace.id = ps.id 
                AND b.status IN (com.example.parkingsystem.entity.BookingStatus.ACTIVE, 
                                 com.example.parkingsystem.entity.BookingStatus.PENDING)
                AND b.startTime < :endTime 
                AND b.endTime > :startTime
            )
            """)
    List<ParkingSpace> findAvailableSpacesForTimeRange(
            @Param("lotId") Long lotId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Check if a specific space is available for a given time range.
     * Returns true if no overlapping bookings exist.
     */
    @Query("""
            SELECT CASE WHEN COUNT(b) = 0 THEN true ELSE false END
            FROM Booking b 
            WHERE b.parkingSpace.id = :spaceId 
            AND b.status IN (com.example.parkingsystem.entity.BookingStatus.ACTIVE, 
                             com.example.parkingsystem.entity.BookingStatus.PENDING)
            AND b.startTime < :endTime 
            AND b.endTime > :startTime
            """)
    boolean isSpaceAvailableForTimeRange(
            @Param("spaceId") Long spaceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
