package com.jobconnect.jobconnect_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompanyRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String industry;

    private String description;

    @Size(max = 255)
    private String website;

    @Size(max = 150)
    private String location;

    @Size(max = 50)
    private String companySize;
}