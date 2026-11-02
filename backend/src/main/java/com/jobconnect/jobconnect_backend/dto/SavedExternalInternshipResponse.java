package com.jobconnect.jobconnect_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedExternalInternshipResponse {

    private Long studentId;

    private String id;

    private String title;

    private String company;

    private String location;

    private String mode;

    private String duration;

    private String stipend;

    private String deadline;

    private String domain;

    private String category;

    private String eligibleYears;

    private String source;

    private String sourceUrl;

    private String verifiedOn;

    private String availabilityNote;

    private LocalDateTime savedAt;
}