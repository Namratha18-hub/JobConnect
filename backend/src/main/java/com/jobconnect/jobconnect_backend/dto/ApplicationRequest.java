package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationRequest {

    @NotNull
    private Long studentId;

    @NotNull
    private Long jobId;

    @NotNull
    private Long resumeId;

    private String coverLetter;
}