package com.example.parkingsystem.controller;

import com.example.parkingsystem.dto.ParkingLotRequest;
import com.example.parkingsystem.entity.ParkingLot;
import com.example.parkingsystem.entity.ParkingSpace;
import com.example.parkingsystem.repository.ParkingLotRepository;
import com.example.parkingsystem.repository.ParkingSpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSpaceRepository parkingSpaceRepository;
    private final com.example.parkingsystem.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.example.parkingsystem.repository.BookingRepository bookingRepository;
    private final com.example.parkingsystem.repository.BookingArchiveRepository bookingArchiveRepository;

    @PostMapping("/parking-lots")
    @PreAuthorize("hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> createParkingLot(@RequestBody ParkingLotRequest request) {
        ParkingLot lot = ParkingLot.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .totalCapacity(request.getTotalCapacity())
                .baseRate(request.getBaseRate())
                .build();

        ParkingLot savedLot = parkingLotRepository.save(lot);

        // Auto-create spaces (mock)
        // In real app, we might specify space details
        List<ParkingSpace> spaces = new ArrayList<>();
        for (int i = 1; i <= request.getTotalCapacity(); i++) {
            spaces.add(ParkingSpace.builder()
                    .parkingLot(savedLot)
                    .spaceNumber("P-" + savedLot.getId() + "-" + i)
                    .isOccupied(false)
                    .priceMultiplier(1.0)
                    .vehicleType(com.example.parkingsystem.entity.VehicleType.CAR) // Default
                    .build());
        }
        parkingSpaceRepository.saveAll(spaces);

        return ResponseEntity.ok(savedLot);
    }

    @PutMapping("/parking-lots/{id}")
    @PreAuthorize("hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> updateParkingLot(@PathVariable Long id, @RequestBody ParkingLotRequest request) {
        return parkingLotRepository.findById(id).map(lot -> {
            lot.setName(request.getName());
            lot.setAddress(request.getAddress());
            lot.setCity(request.getCity());
            lot.setLatitude(request.getLatitude());
            lot.setLongitude(request.getLongitude());
            lot.setBaseRate(request.getBaseRate());

            // Handle capacity change
            int currentCapacity = lot.getTotalCapacity();
            int newCapacity = request.getTotalCapacity();

            if (newCapacity > currentCapacity) {
                // Add new spaces
                List<ParkingSpace> newSpaces = new ArrayList<>();
                for (int i = currentCapacity + 1; i <= newCapacity; i++) {
                    newSpaces.add(ParkingSpace.builder()
                            .parkingLot(lot)
                            .spaceNumber("P-" + lot.getId() + "-" + i)
                            .isOccupied(false)
                            .priceMultiplier(1.0)
                            .vehicleType(com.example.parkingsystem.entity.VehicleType.CAR)
                            .build());
                }
                parkingSpaceRepository.saveAll(newSpaces);
            } else if (newCapacity < currentCapacity) {
                // Reduce capacity - find unoccupied spaces to remove
                // This is a simplified logic: remove only if end spaces are empty or just
                // remove random empty spaces?
                // Better approach for now: Find ALL spaces provided they are empty, limit to
                // (current - new) count.
                // If we can't find enough empty spaces, we fail the reduction or execute
                // partial reduction.

                List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(id);
                List<ParkingSpace> emptySpaces = spaces.stream()
                        .filter(s -> !s.isOccupied())
                        .toList();

                int toRemove = currentCapacity - newCapacity;
                if (emptySpaces.size() < toRemove) {
                    throw new RuntimeException("Cannot reduce capacity to " + newCapacity +
                            ". Only " + emptySpaces.size() + " empty slots available to remove.");
                }

                // Remove the last added spaces first to keep numbering consistent if possible,
                // but for now just removing any empty ones is safer than removing occupied
                // ones.
                // Let's sort by spaceNumber descending to try removing "P-ID-HighNumber" first
                List<ParkingSpace> sortedEmpty = new ArrayList<>(emptySpaces);
                sortedEmpty.sort((s1, s2) -> s2.getSpaceNumber().compareTo(s1.getSpaceNumber()));

                List<ParkingSpace> spacesToRemove = sortedEmpty.subList(0, toRemove);
                parkingSpaceRepository.deleteAll(spacesToRemove);
            }

            lot.setTotalCapacity(newCapacity);
            return ResponseEntity.ok(parkingLotRepository.save(lot));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/parking-lots")
    @PreAuthorize("hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> getAllParkingLots() {
        return ResponseEntity.ok(parkingLotRepository.findAll());
    }

    // ========== User Management Endpoints ==========

    @GetMapping("/users")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            try {
                com.example.parkingsystem.entity.Role roleEnum = com.example.parkingsystem.entity.Role
                        .valueOf(role.toUpperCase());
                return ResponseEntity.ok(userRepository.findByRole(roleEnum));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid role: " + role));
            }
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody java.util.Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String password = request.get("password");
        String roleStr = request.get("role");

        // Default password is 123456 if not provided by admin
        if (password == null || password.isEmpty()) {
            password = "123456";
        }

        if (username == null || email == null || roleStr == null) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", "Username, email, and role are required"));
        }

        // Only allow creating PARKING_MANAGER or CITY_ADMIN
        if (!roleStr.equals("PARKING_MANAGER") && !roleStr.equals("CITY_ADMIN")) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", "Can only create PARKING_MANAGER or CITY_ADMIN users"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Username already exists"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email already exists"));
        }

        com.example.parkingsystem.entity.User user = com.example.parkingsystem.entity.User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(com.example.parkingsystem.entity.Role.valueOf(roleStr))
                .isActive(true)
                .build();

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/users/{id}/activate")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActive(true);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "User activated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/deactivate")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "User deactivated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ========== Lot/Slot Deletion with Archiving ==========

    @DeleteMapping("/parking-lots/{id}")
    @PreAuthorize("hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> deleteParkingLot(@PathVariable Long id) {
        return parkingLotRepository.findById(id).map(lot -> {
            // Archive all bookings for this lot
            java.util.List<com.example.parkingsystem.entity.Booking> bookings = bookingRepository
                    .findByParkingSpace_ParkingLot_Id(id);
            for (com.example.parkingsystem.entity.Booking booking : bookings) {
                com.example.parkingsystem.entity.BookingArchive archive = com.example.parkingsystem.entity.BookingArchive
                        .builder()
                        .originalBookingId(booking.getId())
                        .userId(booking.getUser().getId())
                        .username(booking.getUser().getUsername())
                        .parkingLotName(lot.getName())
                        .parkingLotAddress(lot.getAddress())
                        .spaceNumber(booking.getParkingSpace().getSpaceNumber())
                        .vehicleNumber(booking.getVehicleNumber())
                        .startTime(booking.getStartTime())
                        .endTime(booking.getEndTime())
                        .totalAmount(booking.getTotalAmount())
                        .status(booking.getStatus().name())
                        .build();
                bookingArchiveRepository.save(archive);
            }
            // Delete bookings first (FK constraint)
            bookingRepository.deleteAll(bookings);
            // Delete all spaces
            java.util.List<ParkingSpace> spaces = parkingSpaceRepository.findByParkingLotId(id);
            parkingSpaceRepository.deleteAll(spaces);
            // Delete lot
            parkingLotRepository.delete(lot);
            return ResponseEntity.ok(java.util.Map.of("message", "Parking lot deleted and bookings archived"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/parking-lots/{lotId}/spaces/{spaceId}")
    @PreAuthorize("hasRole('PARKING_MANAGER') or hasRole('CITY_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> deleteParkingSpace(@PathVariable Long lotId, @PathVariable Long spaceId) {
        return parkingSpaceRepository.findById(spaceId).map(space -> {
            if (!space.getParkingLot().getId().equals(lotId)) {
                return ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Space does not belong to this lot"));
            }
            // Archive bookings for this space
            java.util.List<com.example.parkingsystem.entity.Booking> bookings = bookingRepository
                    .findByParkingSpaceId(spaceId);
            for (com.example.parkingsystem.entity.Booking booking : bookings) {
                com.example.parkingsystem.entity.BookingArchive archive = com.example.parkingsystem.entity.BookingArchive
                        .builder()
                        .originalBookingId(booking.getId())
                        .userId(booking.getUser().getId())
                        .username(booking.getUser().getUsername())
                        .parkingLotName(space.getParkingLot().getName())
                        .parkingLotAddress(space.getParkingLot().getAddress())
                        .spaceNumber(space.getSpaceNumber())
                        .vehicleNumber(booking.getVehicleNumber())
                        .startTime(booking.getStartTime())
                        .endTime(booking.getEndTime())
                        .totalAmount(booking.getTotalAmount())
                        .status(booking.getStatus().name())
                        .build();
                bookingArchiveRepository.save(archive);
            }
            bookingRepository.deleteAll(bookings);
            parkingSpaceRepository.delete(space);
            return ResponseEntity.ok(java.util.Map.of("message", "Parking space deleted and bookings archived"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
