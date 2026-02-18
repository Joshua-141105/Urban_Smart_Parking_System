package com.example.parkingsystem.repository;

import com.example.parkingsystem.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionId(String transactionId);

    Optional<PaymentTransaction> findByReferenceIdAndReferenceType(Long referenceId, String referenceType);
}
