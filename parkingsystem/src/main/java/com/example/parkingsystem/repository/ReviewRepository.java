package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByParkingLotId(Long parkingLotId);

    List<Review> findByUserId(Long userId);

    boolean existsByBookingId(Long bookingId);
}
