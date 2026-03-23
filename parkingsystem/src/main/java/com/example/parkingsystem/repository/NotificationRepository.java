package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // FIX: was findByUserIdAndIsReadFalse — correct column is 'read' mapped to is_read
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    // Mark single notification read
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId);

    // Mark all for a user read
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId")
    int markAllAsRead(@Param("userId") Long userId);

    // Delete single notification (only if it belongs to user)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.id = :id AND n.user.id = :userId")
    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // Find by booking (used by scheduler to avoid duplicate notifications)
    List<Notification> findByBookingIdAndUserId(Long bookingId, Long userId);

    @Query("SELECT n FROM Notification n WHERE n.bookingId = :bookingId AND n.title = :title")
    Optional<Notification> findByBookingIdAndTitle(@Param("bookingId") Long bookingId,
                                                    @Param("title") String title);
}