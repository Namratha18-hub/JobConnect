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
public class RecruiterApplicationResponse {

    private Long applicationId;

    private Long studentId;

    private String studentName;

    private String studentLocation;

    private Long jobId;

    private String jobTitle;

    private Long resumeId;

    private String resumeFileName;

    private String coverLetter;

    private String status;

    private LocalDateTime appliedAt;

    private LocalDateTime updatedAt;
}