package com.example.parkingsystem.dto;

import com.example.parkingsystem.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    private Role role; // Optional, default to DRIVER if null

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;
}
