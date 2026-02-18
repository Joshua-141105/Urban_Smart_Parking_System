package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.BookingArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingArchiveRepository extends JpaRepository<BookingArchive, Long> {
    List<BookingArchive> findByUserId(Long userId);
}
