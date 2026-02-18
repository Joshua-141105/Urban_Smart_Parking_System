package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.ParkingSpace;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSpaceRepository extends JpaRepository<ParkingSpace, Long> {

    List<ParkingSpace> findByParkingLotId(Long parkingLotId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ParkingSpace p WHERE p.id = :id")
    Optional<ParkingSpace> findByIdWithLock(@Param("id") Long id);
}
