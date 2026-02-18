package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ParkingLotRepository extends JpaRepository<ParkingLot, Long> {
    List<ParkingLot> findByCity(String city);

    org.springframework.data.domain.Page<ParkingLot> findByNameContainingIgnoreCase(String name,
            org.springframework.data.domain.Pageable pageable);

    // We will use custom query for Haversine later or do in memory if data volume
    // low,
    // but for now standard JPA.
}
