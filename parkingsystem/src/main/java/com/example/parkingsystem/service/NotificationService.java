package com.example.parkingsystem.service;

import com.example.parkingsystem.dto.NotificationDTO;
import com.example.parkingsystem.entity.Notification;
import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.NotificationRepository;
import com.example.parkingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ── READ ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    // ── MARK READ ────────────────────────────────────────────

    @Transactional
    public boolean markAsRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        return updated > 0;
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    // ── DELETE ───────────────────────────────────────────────

    @Transactional
    public boolean deleteNotification(Long notificationId, Long userId) {
        int deleted = notificationRepository.deleteByIdAndUserId(notificationId, userId);
        return deleted > 0;
    }

    // ── CREATE (used internally by booking lifecycle) ────────

    /**
     * Create a notification for a user. Avoids duplicates by checking
     * bookingId + title combination.
     */
    @Transactional
    public NotificationDTO createNotification(Long userId, String title, String message,
                                               String type, String iconType, Long bookingId) {
        // Guard: avoid duplicate notifications for same booking + title
        if (bookingId != null) {
            notificationRepository.findByBookingIdAndTitle(bookingId, title)
                    .ifPresent(existing -> {
                        log.debug("Notification already exists for bookingId={} title={}", bookingId, title);
                    });
            boolean exists = notificationRepository
                    .findByBookingIdAndTitle(bookingId, title)
                    .isPresent();
            if (exists) {
                return null; // don't create duplicate
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .iconType(iconType)
                .read(false)
                .bookingId(bookingId)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = NotificationDTO.from(saved);

        // Push to WebSocket so frontend gets real-time update
        try {
            messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", dto);
        } catch (Exception e) {
            log.warn("WebSocket push failed for userId={}: {}", userId, e.getMessage());
        }

        return dto;
    }

    // ── BOOKING LIFECYCLE HELPERS ────────────────────────────

    public void notifyBookingCreated(Long userId, Long bookingId, String lotName) {
        createNotification(
                userId,
                "Booking Confirmed",
                "Your parking slot at " + lotName + " has been successfully booked.",
                "success",
                "check",
                bookingId
        );
    }

    public void notifyBookingStarted(Long userId, Long bookingId, String lotName) {
        createNotification(
                userId,
                "Parking Session Started",
                "Your parking session at " + lotName + " has started. Drive safely!",
                "info",
                "clock",
                bookingId
        );
    }

    public void notifyBookingEnded(Long userId, Long bookingId, String lotName) {
        createNotification(
                userId,
                "Session Ended",
                "Thank you for parking at " + lotName + ". Please visit again!",
                "info",
                "check",
                bookingId
        );
    }

    public void notifyBookingExpiringSoon(Long userId, Long bookingId, String lotName, int minutesLeft) {
        createNotification(
                userId,
                "Parking Expiring Soon",
                "Your parking at " + lotName + " expires in " + minutesLeft + " minutes.",
                "warning",
                "clock",
                bookingId
        );
    }
}