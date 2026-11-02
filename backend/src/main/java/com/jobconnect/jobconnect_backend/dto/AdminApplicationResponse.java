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
public class AdminApplicationResponse {

    private Long applicationId;

    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentLocation;

    private Long jobId;
    private String jobTitle;
    private String companyName;

    private String status;

    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}