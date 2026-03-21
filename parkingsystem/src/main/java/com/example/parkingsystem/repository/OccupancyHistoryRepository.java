package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.OccupancyHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OccupancyHistoryRepository extends JpaRepository<OccupancyHistory, Long> {
    List<OccupancyHistory> findByParkingLotIdAndRecordedAtBetween(Long parkingLotId, LocalDateTime start, LocalDateTime end);
}
