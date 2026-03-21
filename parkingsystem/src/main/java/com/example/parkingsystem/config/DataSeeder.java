package com.example.parkingsystem.config;

import com.example.parkingsystem.entity.*;
import com.example.parkingsystem.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final ParkingLotRepository parkingLotRepository;
        private final ParkingSpaceRepository parkingSpaceRepository;
        private final OccupancyHistoryRepository occupancyHistoryRepository;
        private final PasswordEncoder encoder;


        @Override
        public void run(String... args) throws Exception {
                seedUsers();
                if (parkingLotRepository.count() == 0) {
                        seedParkingLots();
                }
                
                // Ensure some congestion exists for demo purposes
                ensureCongestionAlerts();
        }

        private void ensureCongestionAlerts() {
            List<ParkingLot> allLots = parkingLotRepository.findAll();
            if (allLots.isEmpty()) return;

            // Congest 20% of the lots (e.g., first 6 lots if 30 total)
            int lotsToCongest = Math.max(1, (int) (allLots.size() * 0.2));
            
            for (int i = 0; i < lotsToCongest; i++) {
                ParkingLot lot = allLots.get(i);
                List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());
                
                if (spaces.isEmpty()) continue;
                
                // Force 92% occupancy to trigger "High Congestion" alert (>90%)
                int spacesToOccupy = (int) (spaces.size() * 0.92);
                
                for (int j = 0; j < spaces.size(); j++) {
                    ParkingSpace space = spaces.get(j);
                    // Occupy the first N spaces
                    space.setOccupied(j < spacesToOccupy);
                }
                parkingSpaceRepository.saveAll(spaces);
            }
            System.out.println("✓ Ensured " + lotsToCongest + " lots have high congestion for demo alerts");
        }

        private void seedUsers() {
                List<User> users = new ArrayList<>();

                if (userRepository.findByUsername("sysadmin").isEmpty()) {
                        User sysAdmin = User.builder()
                                        .username("sysadmin")
                                        .email("sysadmin@parking.com")
                                        .password(encoder.encode("admin123"))
                                        .role(Role.SYSTEM_ADMIN)
                                        .isActive(true)
                                        .phoneNumber("+91 99999 99999")
                                        .build();
                        users.add(sysAdmin);
                }

                if (userRepository.findByEmail("admin1@parking.com").isPresent()) {
                        if (!users.isEmpty()) {
                                userRepository.saveAll(users);
                                System.out.println("✓ Seeded " + users.size() + " missing users");
                        } else {
                                System.out.println("Users already seeded");
                        }
                        return;
                }

                // Create 3 specific admins for the demo
                User admin1 = User.builder()
                                .username("admin1")
                                .email("admin1@parking.com")
                                .password(encoder.encode("password"))
                                .role(Role.CITY_ADMIN)
                                .isActive(true)
                                .phoneNumber("+91 90001 00001")
                                .build();
                users.add(admin1);

                User admin2 = User.builder()
                                .username("admin2")
                                .email("admin2@parking.com")
                                .password(encoder.encode("password"))
                                .role(Role.CITY_ADMIN)
                                .isActive(true)
                                .phoneNumber("+91 90002 00002")
                                .build();
                users.add(admin2);

                User admin3 = User.builder()
                                .username("admin3")
                                .email("admin3@parking.com")
                                .password(encoder.encode("password"))
                                .role(Role.CITY_ADMIN)
                                .isActive(true)
                                .phoneNumber("+91 90003 00003")
                                .build();
                users.add(admin3);

                // Add standard roles for other testing
                users.add(User.builder().username("driver").email("driver@parksmart.com")
                                .password(encoder.encode("driver123")).role(Role.DRIVER).isActive(true)
                                .phoneNumber("+91 98765 43210").loyaltyPoints(150).build());

                userRepository.saveAll(users);
                System.out.println("✓ Seeded " + users.size() + " users");
        }

        private void seedParkingLots() {
                if (parkingLotRepository.count() > 0) {
                        return;
                }

                User admin1 = userRepository.findByEmail("admin1@parking.com").orElseThrow();
                User admin2 = userRepository.findByEmail("admin2@parking.com").orElseThrow();
                User admin3 = userRepository.findByEmail("admin3@parking.com").orElseThrow();

                List<User> admins = Arrays.asList(admin1, admin2, admin3);
                Random random = new Random(42);

                // Chennai Bounds
                double minLat = 13.00;
                double maxLat = 13.10;
                double minLon = 80.20;
                double maxLon = 80.30;

                for (int i = 0; i < 30; i++) {
                        // Assign admin based on index (10 lots per admin)
                        User owner = admins.get(i / 10);

                        // Random Coordinates
                        double latitude = minLat + (maxLat - minLat) * random.nextDouble();
                        double longitude = minLon + (maxLon - minLon) * random.nextDouble();

                        // Random Capacity
                        int totalSpaces = 50 + random.nextInt(251); // 50 to 300
                        int availableSpaces = random.nextInt(totalSpaces + 1);
                        double baseRate = 20 + random.nextInt(81); // 20 to 100

                        ParkingLot lot = ParkingLot.builder()
                                        .name("Chennai Smart Parking " + (i + 1))
                                        .address("Address Line " + (i + 1) + ", Chennai")
                                        .city("Chennai")
                                        .latitude(BigDecimal.valueOf(latitude))
                                        .longitude(BigDecimal.valueOf(longitude))
                                        .totalCapacity(totalSpaces)
                                        .baseRate(baseRate)
                                        .owner(owner)
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                        parkingLotRepository.save(lot);

                        // Seed Spaces
                        seedSpacesForLot(lot, totalSpaces, availableSpaces, random);

                        // Seed History
                        seedHistoryForLot(lot, random);
                }
                System.out.println("✓ Seeded 30 Parking Lots in Chennai");
        }

        private void seedSpacesForLot(ParkingLot lot, int total, int available, Random random) {
                List<ParkingSpace> spaces = new ArrayList<>();
                int occupiedCount = total - available;

                for (int i = 1; i <= total; i++) {
                        boolean isOccupied = i <= occupiedCount;
                        boolean isMaintenance = !isOccupied && random.nextDouble() < 0.05; // 5% chance if not occupied

                        spaces.add(ParkingSpace.builder()
                                        .parkingLot(lot)
                                        .spaceNumber("SP-" + i)
                                        .vehicleType(VehicleType.CAR)
                                        .isOccupied(isOccupied)
                                        .isMaintenance(isMaintenance)
                                        .priceMultiplier(1.0)
                                        .build());
                }
                parkingSpaceRepository.saveAll(spaces);
        }
        
        private void seedHistoryForLot(ParkingLot lot, Random random) {
                List<OccupancyHistory> history = new ArrayList<>();
                for (int i = 0; i < 10; i++) {
                        history.add(OccupancyHistory.builder()
                                        .parkingLot(lot)
                                        .occupancyPercentage(random.nextDouble() * 100)
                                        .recordedAt(LocalDateTime.now().minusHours(i * 2))
                                        .build());
                }
                occupancyHistoryRepository.saveAll(history);
        }
}
