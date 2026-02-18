package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingService {

    private final ParkingLotRepository parkingLotRepository;
    private final RouteEngineService routeEngineService;

    public List<ParkingLot> findNearestParking(double lat, double lon, double radiusKm) {
        List<ParkingLot> allLots = parkingLotRepository.findAll();

        return allLots.stream()
                .map(lot -> {
                    double dist = routeEngineService.calculateHaversineDistance(
                            lat, lon, lot.getLatitude().doubleValue(), lot.getLongitude().doubleValue());
                    // We could attach distance to a DTO here.
                    // For now, filtering.
                    return new LotDistance(lot, dist);
                })
                .filter(ld -> ld.distance <= radiusKm)
                .sorted(Comparator.comparingDouble(ld -> ld.distance))
                .limit(5)
                .map(ld -> ld.lot)
                .collect(Collectors.toList());
    }

    private static class LotDistance {
        ParkingLot lot;
        double distance;

        public LotDistance(ParkingLot lot, double distance) {
            this.lot = lot;
            this.distance = distance;
        }
    }
}
