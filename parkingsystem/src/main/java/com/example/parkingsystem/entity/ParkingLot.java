package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "parking_lots", indexes = {
        @Index(name = "idx_parking_lot_city", columnList = "city"),
        @Index(name = "idx_parking_lot_lat_lon", columnList = "latitude, longitude")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ParkingLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Integer totalCapacity;

    @Column(nullable = false)
    private Double baseRate; // Hourly rate

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "parkingLot", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParkingSpace> spaces;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
