package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id"),
        @Index(name = "idx_notification_read", columnList = "user_id, is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 512)
    private String message;

    // title for grouping (e.g. "Booking Confirmed")
    @Column(length = 255)
    private String title;

    // type: info | warning | danger | success
    @Builder.Default
    @Column(nullable = false, length = 50)
    private String type = "info";

    // icon hint for frontend: clock | alert | file | credit | bell | check
    @Builder.Default
    @Column(length = 50)
    private String iconType = "bell";

    // FIX: renamed from isRead to read — consistent with JPA boolean naming
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    // booking this notification belongs to (optional)
    @Column(name = "booking_id")
    private Long bookingId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}