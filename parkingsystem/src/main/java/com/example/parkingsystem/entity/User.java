package com.example.parkingsystem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(nullable = false)
    private Integer completedBookings = 0;

    @Column(unique = true)
    private String phoneNumber;

    @Builder.Default
    @Column(nullable = false)
    private Integer loyaltyPoints = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean notifyEmail = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean notifySms = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean notifyPush = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    private String accessibilityNeeds; // e.g., "WHEELCHAIR", "SENIOR_CITIZEN"
}
