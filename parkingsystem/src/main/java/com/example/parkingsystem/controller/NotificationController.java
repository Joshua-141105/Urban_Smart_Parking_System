package com.example.parkingsystem.controller;

import com.example.parkingsystem.dto.NotificationDTO;
import com.example.parkingsystem.security.UserDetailsImpl;
import com.example.parkingsystem.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Returns all notifications for the authenticated user (newest first).
     * FIX: was throwing 500 due to missing controller + broken entity field name.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<NotificationDTO> notifications = notificationService
                    .getUserNotifications(userDetails.getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Failed to fetch notifications for userId={}: {}", userDetails.getId(), e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Returns count of unread notifications.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * PUT /api/notifications/{id}/read  (also supports PATCH)
     * Mark a single notification as read.
     */
    @PutMapping("/{id}/read")
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            boolean updated = notificationService.markAsRead(id, userDetails.getId());
            if (updated) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Marked as read"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to mark notification {} as read: {}", id, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Failed to update notification"));
        }
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications for the user as read.
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            notificationService.markAllAsRead(userDetails.getId());
            return ResponseEntity.ok(Map.of("success", true, "message", "All marked as read"));
        } catch (Exception e) {
            log.error("Failed to mark all as read for userId={}: {}", userDetails.getId(), e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Failed to update notifications"));
        }
    }

    /**
     * DELETE /api/notifications/{id}
     * Delete a single notification (only if it belongs to the user).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            boolean deleted = notificationService.deleteNotification(id, userDetails.getId());
            if (deleted) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Notification deleted"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to delete notification {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Failed to delete notification"));
        }
    }
}