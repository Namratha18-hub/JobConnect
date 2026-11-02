package com.jobconnect.jobconnect_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecruiterProfileResponse {

    private Long userId;
    private Long companyId;
    private String designation;
}