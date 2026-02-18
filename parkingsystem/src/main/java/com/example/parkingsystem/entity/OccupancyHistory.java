package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "occupancy_history", indexes = {
        @Index(name = "idx_occupancy_lot_time", columnList = "parking_lot_id, recordedAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class OccupancyHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(nullable = false)
    private Double occupancyPercentage;

    @Column(nullable = false)
    private LocalDateTime recordedAt;
}
