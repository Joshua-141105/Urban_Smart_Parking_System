package com.example.parkingsystem.service;

import com.example.parkingsystem.entity.PaymentMethod;
import com.example.parkingsystem.entity.PaymentStatus;
import com.example.parkingsystem.entity.PaymentTransaction;
import com.example.parkingsystem.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentRepository;

    @Transactional
    public PaymentTransaction processPayment(Long userId, Double amount, String referenceType,
            String paymentMethodStr) {
        // In a real system, you would integrate with Razorpay/Stripe here
        // and verify the signature/webhook.

        PaymentMethod method = PaymentMethod.valueOf(paymentMethodStr.toUpperCase());

        PaymentTransaction transaction = PaymentTransaction.builder()
                .userId(userId)
                .amount(amount)
                .referenceType(referenceType)
                .referenceId(0L) // Will be updated by the caller (Booking/Permit service) or linked via ID
                                 // return
                .transactionId("TXN_" + System.currentTimeMillis())
                .paymentMethod(method)
                .status(PaymentStatus.SUCCESS) // Mocking success
                .timestamp(LocalDateTime.now())
                .build();

        return paymentRepository.save(transaction);
    }
}
