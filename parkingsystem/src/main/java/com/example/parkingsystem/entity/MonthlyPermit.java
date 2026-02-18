package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_permits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class MonthlyPermit {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "permits",
                        "bookings" })
        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "parkingSpaces",
                        "permits" })
        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "parking_lot_id", nullable = false)
        private ParkingLot parkingLot;

        @Column(nullable = false)
        private LocalDateTime startDate;

        @Column(nullable = false)
        private LocalDateTime endDate;

        @Builder.Default
        @Column(nullable = false)
        private boolean isActive = true;

        @CreatedDate
        @Column(nullable = false, updatable = false)
        private LocalDateTime purchasedAt;
}
