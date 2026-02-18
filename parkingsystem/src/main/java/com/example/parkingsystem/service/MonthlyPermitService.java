package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.MonthlyPermit;
import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.entity.User;
import com.example.parkingsystem.repository.MonthlyPermitRepository;
import com.example.parkingsystem.repository.ParkingLotRepository;
import com.example.parkingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyPermitService {

    private final MonthlyPermitRepository permitRepository;
    private final UserRepository userRepository;
    private final ParkingLotRepository parkingLotRepository;

    @Transactional
    public MonthlyPermit purchasePermit(Long userId, Long lotId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new RuntimeException("Parking Lot not found"));

        // Check if already has active permit for this lot
        if (hasActivePermit(userId, lotId)) {
            throw new RuntimeException("User already has an active permit for this parking lot");
        }

        // Create permit validdelay for 30 days
        MonthlyPermit permit = MonthlyPermit.builder()
                .user(user)
                .parkingLot(lot)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .build();

        // In a real system, we would process payment here.

        return permitRepository.save(permit);
    }

    public List<MonthlyPermit> getUserPermits(Long userId) {
        return permitRepository.findByUserId(userId);
    }

    public boolean hasActivePermit(Long userId, Long lotId) {
        return permitRepository.findActivePermit(userId, lotId, LocalDateTime.now()).isPresent();
    }
}
