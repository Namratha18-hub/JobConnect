package com.jobconnect.jobconnect_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceUpdateRequest {

    private String companyName;
    private String jobTitle;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}