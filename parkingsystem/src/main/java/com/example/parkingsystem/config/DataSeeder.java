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
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder encoder;

    private static final Object[][] TN_CITIES = {
            { "Coimbatore", 11.0168, 76.9558, 15 }, 
            { "Chennai", 13.0827, 80.2707, 8 },
            { "Madurai", 9.9252, 78.1198, 5 },
            { "Tiruchirappalli", 10.7905, 78.7047, 4 },
            { "Salem", 11.6643, 78.1460, 3 },
            { "Tirunelveli", 8.7139, 77.7567, 3 },
            { "Erode", 11.3410, 77.7172, 3 },
            { "Vellore", 12.9165, 79.1325, 3 },
            { "Thoothukudi", 8.7642, 78.1348, 2 },
            { "Tiruppur", 11.1085, 77.3411, 3 },
            { "Dindigul", 10.3673, 77.9803, 2 },
            { "Thanjavur", 10.7870, 79.1378, 2 },
            { "Ranipet", 12.9224, 79.3326, 2 },
            { "Sivakasi", 9.4533, 77.8025, 2 },
            { "Karur", 10.9601, 78.0766, 2 },
            { "Udhagamandalam", 11.4102, 76.6950, 2 },
            { "Hosur", 12.7409, 77.8253, 2 },
            { "Nagercoil", 8.1833, 77.4119, 2 },
            { "Kanchipuram", 12.8342, 79.7036, 2 },
            { "Kumarapalayam", 11.4387, 77.6944, 1 },
            { "Karaikkudi", 10.0681, 78.7686, 1 },
            { "Neyveli", 11.6074, 79.4914, 1 },
            { "Cuddalore", 11.7480, 79.7714, 2 },
            { "Kumbakonam", 10.9617, 79.3881, 2 },
            { "Tiruvannamalai", 12.2253, 79.0747, 2 },
            { "Pollachi", 10.6609, 77.0087, 2 },
            { "Rajapalayam", 9.4525, 77.5536, 1 },
            { "Gudiyatham", 12.9465, 78.8698, 1 },
            { "Pudukkottai", 10.3833, 78.8001, 1 },
            { "Vaniyambadi", 12.6819, 78.6200, 1 },
            { "Ambur", 12.7910, 78.7163, 1 },
            { "Nagapattinam", 10.7672, 79.8449, 1 },
            { "Mayiladuthurai", 11.1018, 79.6491, 1 },
            { "Aruppukkottai", 9.5138, 78.0960, 1 },
            { "Srivilliputhur", 9.5120, 77.6346, 1 },
            { "Tindivanam", 12.2340, 79.6567, 1 },
            { "Villupuram", 11.9401, 79.4861, 1 },
            { "Tiruchengode", 11.3800, 77.8940, 1 },
            { "Namakkal", 11.2189, 78.1674, 1 },
            { "Theni", 10.0104, 77.4768, 1 },
            { "Palani", 10.4502, 77.5200, 1 },
            { "Arakkonam", 13.0846, 79.6700, 1 },
            { "Paramakudi", 9.5437, 78.5909, 1 },
            { "Virudhunagar", 9.5851, 77.9524, 1 },
            { "Sankarankovil", 9.1678, 77.5337, 1 },
            { "Kovilpatti", 9.1730, 77.8710, 1 },
            { "Coonoor", 11.3530, 76.7959, 1 },
            { "Mettupalayam", 11.2990, 76.9366, 1 },
            { "Dharapuram", 10.7364, 77.5273, 1 },
            { "Avinashi", 11.1918, 77.2674, 1 },
            { "Valparai", 10.3268, 76.9503, 1 },
            { "Attur", 11.5976, 78.6020, 1 },
            { "Mettur", 11.7876, 77.8010, 1 }
    };

    // Landmark names for realistic lot names
    private static final String[] LANDMARKS = {
            "Central", "Railway Station", "Bus Stand", "Town Hall", "Market", "Mall",
            "Hospital", "College", "Stadium", "Temple", "Park", "Cinema", "Tower",
            "Junction", "Circle", "Main Road", "Bazaar", "Commercial Complex"
    };

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
            seedParkingLots();
            seedSampleBookingsAndReviews();
        }
    }

    private void seedUsers() {
        List<User> users = Arrays.asList(
                // System Admin
                User.builder().username("admin").email("admin@parksmart.com")
                        .password(encoder.encode("admin123")).role(Role.SYSTEM_ADMIN).isActive(true).build(),
                // City Admins
                User.builder().username("cityadmin").email("city@parksmart.com")
                        .password(encoder.encode("city123")).role(Role.CITY_ADMIN).isActive(true).build(),
                User.builder().username("cityadmin_cbe").email("citycbe@parksmart.com")
                        .password(encoder.encode("city123")).role(Role.CITY_ADMIN).isActive(true).build(),
                // Parking Managers
                User.builder().username("manager").email("manager@parksmart.com")
                        .password(encoder.encode("manager123")).role(Role.PARKING_MANAGER).isActive(true).build(),
                User.builder().username("manager_cbe").email("managercbe@parksmart.com")
                        .password(encoder.encode("manager123")).role(Role.PARKING_MANAGER).isActive(true).build(),
                User.builder().username("manager_chennai").email("managerchennai@parksmart.com")
                        .password(encoder.encode("manager123")).role(Role.PARKING_MANAGER).isActive(true).build(),
                // Drivers
                User.builder().username("driver").email("driver@parksmart.com")
                        .password(encoder.encode("driver123")).role(Role.DRIVER).isActive(true)
                        .phoneNumber("+91 98765 43210").loyaltyPoints(150).build(),
                User.builder().username("john").email("john@gmail.com")
                        .password(encoder.encode("john123")).role(Role.DRIVER).isActive(true)
                        .phoneNumber("+91 99887 76655").loyaltyPoints(320).build(),
                User.builder().username("priya").email("priya@gmail.com")
                        .password(encoder.encode("priya123")).role(Role.DRIVER).isActive(true)
                        .phoneNumber("+91 94432 11234").loyaltyPoints(85).build(),
                User.builder().username("kumar").email("kumar@gmail.com")
                        .password(encoder.encode("kumar123")).role(Role.DRIVER).isActive(true)
                        .phoneNumber("+91 90909 12345").loyaltyPoints(500).build());
        userRepository.saveAll(users);
        System.out.println("✓ Seeded " + users.size() + " users");
    }

    private void seedParkingLots() {
        User owner = userRepository.findByUsername("manager").orElse(null);
        Random random = new Random(42); // Fixed seed for reproducibility
        int totalLots = 0;
        int totalSpaces = 0;

        for (Object[] cityData : TN_CITIES) {
            String city = (String) cityData[0];
            double baseLat = (double) cityData[1];
            double baseLon = (double) cityData[2];
            int numLots = (int) cityData[3];

            for (int i = 0; i < numLots; i++) {
                // Random shift within city (approx 2-5km radius)
                double latShift = (random.nextDouble() - 0.5) * 0.05;
                double lonShift = (random.nextDouble() - 0.5) * 0.05;

                String landmark = LANDMARKS[random.nextInt(LANDMARKS.length)];
                String lotName = city + " " + landmark + " Parking";
                if (i > 0)
                    lotName = city + " " + landmark + " " + (i + 1);

                int capacity = 15 + random.nextInt(36); // 15-50 capacity
                double rate = 15.0 + random.nextDouble() * 35; // Rs 15-50

                ParkingLot lot = ParkingLot.builder()
                        .name(lotName)
                        .address(landmark + ", " + city + ", Tamil Nadu")
                        .city(city)
                        .latitude(BigDecimal.valueOf(baseLat + latShift))
                        .longitude(BigDecimal.valueOf(baseLon + lonShift))
                        .totalCapacity(capacity)
                        .baseRate(Math.round(rate * 100.0) / 100.0)
                        .owner(owner)
                        .build();

                parkingLotRepository.save(lot);
                totalLots++;

                // Create spaces for this lot
                for (int j = 1; j <= capacity; j++) {
                    VehicleType vType = j <= capacity * 0.7 ? VehicleType.CAR
                            : (j <= capacity * 0.9 ? VehicleType.BIKE : VehicleType.TRUCK);
                    ParkingSpace space = ParkingSpace.builder()
                            .parkingLot(lot)
                            .spaceNumber("P" + lot.getId() + "-" + j)
                            .isOccupied(random.nextDouble() < 0.25) // 25% random occupancy
                            .priceMultiplier(1.0)
                            .vehicleType(vType)
                            .build();
                    parkingSpaceRepository.save(space);
                    totalSpaces++;
                }
            }
        }
        System.out.println("✓ Seeded " + totalLots + " parking lots across " + TN_CITIES.length + " Tamil Nadu cities");
        System.out.println("✓ Seeded " + totalSpaces + " parking spaces");
    }

    private void seedSampleBookingsAndReviews() {
        // Get a driver user
        User driver = userRepository.findByUsername("driver").orElse(null);
        if (driver == null)
            return;

        // Get some parking lots
        List<ParkingLot> lots = parkingLotRepository.findAll();
        if (lots.isEmpty())
            return;

        Random random = new Random(123);
        int bookingCount = 0;
        int reviewCount = 0;

        // Create sample completed bookings with reviews for the first 20 lots
        for (int i = 0; i < Math.min(20, lots.size()); i++) {
            ParkingLot lot = lots.get(i);
            List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(lot.getId());
            if (spaces.isEmpty())
                continue;

            ParkingSpace space = spaces.get(0);
            LocalDateTime now = LocalDateTime.now();

            // Create a completed booking
            Booking booking = Booking.builder()
                    .user(driver)
                    .parkingSpace(space)
                    .vehicleNumber("TN " + String.format("%02d", random.nextInt(99)) + " AB "
                            + String.format("%04d", random.nextInt(9999)))
                    .startTime(now.minusDays(random.nextInt(30) + 1).minusHours(random.nextInt(5)))
                    .endTime(now.minusDays(random.nextInt(30) + 1))
                    .totalAmount(20.0 + random.nextDouble() * 100)
                    .status(BookingStatus.COMPLETED)
                    .build();
            bookingRepository.save(booking);
            bookingCount++;

            // Create a review for some bookings
            if (random.nextDouble() < 0.7) { // 70% have reviews
                Review review = Review.builder()
                        .userId(driver.getId())
                        .parkingLotId(lot.getId())
                        .bookingId(booking.getId())
                        .rating(3 + random.nextInt(3)) // 3-5 stars
                        .comment(getRandomComment(random))
                        .build();
                reviewRepository.save(review);
                reviewCount++;
            }
        }
        System.out.println("✓ Seeded " + bookingCount + " sample bookings");
        System.out.println("✓ Seeded " + reviewCount + " sample reviews");
    }

    private String getRandomComment(Random random) {
        String[] comments = {
                "Great parking facility, well maintained!",
                "Convenient location and easy to find.",
                "Good security, will park here again.",
                "Clean and organized. Recommended!",
                "Staff was helpful. Nice experience.",
                "Affordable rates for the location.",
                "Spacious parking slots. Easy maneuvering.",
                "Well lit area, felt safe leaving my car.",
                "Quick entry and exit process.",
                "Excellent facility near the main market."
        };
        return comments[random.nextInt(comments.length)];
    }
}
