package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileRequest {

    @Size(max = 20)
    private String phone;

    @Size(max = 150)
    private String location;

    private String bio;

    private LocalDate dateOfBirth;
}