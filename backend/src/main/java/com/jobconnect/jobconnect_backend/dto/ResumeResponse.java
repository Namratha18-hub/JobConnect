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
public class ResumeResponse {

    private Long id;
    private Long studentId;
    private String fileName;
    private String filePath;
    private Boolean isActive;
    private LocalDateTime uploadedAt;
}