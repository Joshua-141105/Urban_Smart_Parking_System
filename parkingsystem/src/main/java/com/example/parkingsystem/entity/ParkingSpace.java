package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parking_spaces", indexes = {
        @Index(name = "idx_parking_space_lot", columnList = "parking_lot_id"),
        @Index(name = "idx_parking_space_status", columnList = "isOccupied")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String spaceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Builder.Default
    @Column(nullable = false)
    private boolean isOccupied = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean isMaintenance = false;

    @Builder.Default
    private Double priceMultiplier = 1.0;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Version
    private Long version; // For optimistic locking if needed, though we act use pessimistic
}
