package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class EducationRequest {

    @NotNull
    private Long studentId;

    @NotBlank
    @Size(max = 200)
    private String institution;

    @NotBlank
    @Size(max = 150)
    private String degree;

    @Size(max = 150)
    private String fieldOfStudy;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 50)
    private String grade;
}