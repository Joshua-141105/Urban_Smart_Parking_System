package com.example.parkingsystem.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ParkingLotRequest {
    private String name;
    private String address;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer totalCapacity;
    private Double baseRate;
}
