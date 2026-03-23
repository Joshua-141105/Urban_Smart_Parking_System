package com.example.parkingsystem.dto;

import com.example.parkingsystem.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long id;
    private String message;
    private String title;
    private String type;
    private String iconType;
    private boolean read;
    private Long bookingId;
    private LocalDateTime createdAt;
    private String timestamp; // human-readable "2 mins ago"

    public static NotificationDTO from(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .message(n.getMessage())
                .title(n.getTitle() != null ? n.getTitle() : "Notification")
                .type(n.getType())
                .iconType(n.getIconType())
                .read(n.isRead())
                .bookingId(n.getBookingId())
                .createdAt(n.getCreatedAt())
                .timestamp(formatTimeAgo(n.getCreatedAt()))
                .build();
    }

    private static String formatTimeAgo(LocalDateTime createdAt) {
        if (createdAt == null) return "Just now";
        long diffMinutes = java.time.Duration.between(createdAt, LocalDateTime.now()).toMinutes();
        if (diffMinutes < 1) return "Just now";
        if (diffMinutes < 60) return diffMinutes + " min" + (diffMinutes > 1 ? "s" : "") + " ago";
        long diffHours = diffMinutes / 60;
        if (diffHours < 24) return diffHours + " hour" + (diffHours > 1 ? "s" : "") + " ago";
        long diffDays = diffHours / 24;
        return diffDays + " day" + (diffDays > 1 ? "s" : "") + " ago";
    }
}