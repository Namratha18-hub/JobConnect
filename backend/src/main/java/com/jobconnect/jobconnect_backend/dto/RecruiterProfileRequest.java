package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecruiterProfileRequest {

    @NotNull
    private Long companyId;

    @Size(max = 100)
    private String designation;
}