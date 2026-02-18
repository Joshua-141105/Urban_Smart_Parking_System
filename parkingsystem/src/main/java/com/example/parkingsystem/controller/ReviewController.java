package com.example.parkingsystem.controller;

import com.example.parkingsystem.entity.Review;
import com.example.parkingsystem.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review) {
        if (reviewRepository.existsByBookingId(review.getBookingId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Review already exists for this booking"));
        }
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @GetMapping("/lot/{parkingLotId}")
    public ResponseEntity<?> getReviewsByLot(@PathVariable Long parkingLotId) {
        return ResponseEntity.ok(reviewRepository.findByParkingLotId(parkingLotId));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getGlobalStats() {
        List<Review> allReviews = reviewRepository.findAll();

        // Distribution of ratings (1-5)
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++)
            distribution.put(i, 0L);

        double totalRating = 0;
        for (Review r : allReviews) {
            distribution.put(r.getRating(), distribution.get(r.getRating()) + 1);
            totalRating += r.getRating();
        }

        double averageRating = allReviews.isEmpty() ? 0 : totalRating / allReviews.size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReviews", allReviews.size());
        stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
        stats.put("distribution", distribution);

        return ResponseEntity.ok(stats);
    }
}
