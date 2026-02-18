package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Archive table for bookings when their associated parking space/lot is
 * deleted.
 * Stores a snapshot of booking data without FK dependency.
 */
@Entity
@Table(name = "booking_archives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long originalBookingId;
    private Long userId;
    private String username;

    private String parkingLotName;
    private String parkingLotAddress;
    private String spaceNumber;

    private String vehicleNumber;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double totalAmount;
    private String status;

    @Column(nullable = false)
    private LocalDateTime archivedAt;

    @PrePersist
    protected void onCreate() {
        archivedAt = LocalDateTime.now();
    }
}
