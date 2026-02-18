package com.example.parkingsystem.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    private Long parkingSpaceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long userId; // For admin/testing, or extract from JWT
}
