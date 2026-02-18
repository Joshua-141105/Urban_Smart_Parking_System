package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.MonthlyPermit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyPermitRepository extends JpaRepository<MonthlyPermit, Long> {

    List<MonthlyPermit> findByUserId(Long userId);

    @Query("SELECT p FROM MonthlyPermit p WHERE p.user.id = :userId AND p.parkingLot.id = :lotId AND p.isActive = true AND p.endDate > :now")
    Optional<MonthlyPermit> findActivePermit(@Param("userId") Long userId, @Param("lotId") Long lotId,
            @Param("now") LocalDateTime now);
}
