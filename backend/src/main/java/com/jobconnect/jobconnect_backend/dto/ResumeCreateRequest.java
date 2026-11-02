package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeCreateRequest {

    @NotNull
    private Long studentId;

    @NotBlank
    private String fileName;

    @NotBlank
    private String filePath;

    @NotNull
    private Long fileSize;
}
