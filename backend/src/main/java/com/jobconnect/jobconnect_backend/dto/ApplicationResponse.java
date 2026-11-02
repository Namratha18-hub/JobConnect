package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Application.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {

    private Long id;
    private Long studentId;
    private Long jobId;
    private Long resumeId;
    private String coverLetter;
    private Status status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}