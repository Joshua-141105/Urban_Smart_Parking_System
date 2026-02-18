package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.Notification;
import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public void sendNotification(User user, String message) {
        // Save to DB
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now()) // Since we use JPA Auditing, but for manual creation here
                .build();

        // If we didn't set createdAt in entity (removed manually if @CreatedDate
        // works),
        // @CreatedDate works on save. But we are setting it here just in case or if
        // unrelated.
        // Actually entity has @CreatedDate, so we don't need to set it manually if we
        // save.
        // But builder might override it to null if we don't set it if we rely purely on
        // Listener?
        // JPA Listener sets it regardless if null usually.

        notificationRepository.save(notification);

        // Send to WebSocket topic
        // Topic: /topic/user/{userId}
        messagingTemplate.convertAndSend("/topic/user/" + user.getId(), message);
    }

    public void broadcastOccupancyUpdate(Long lotId, Double newOccupancy) {
        messagingTemplate.convertAndSend("/topic/parking/" + lotId, "Occupancy Updated: " + newOccupancy + "%");
    }
}
