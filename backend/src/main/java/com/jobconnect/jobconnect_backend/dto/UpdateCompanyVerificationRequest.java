
package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.enums.VerificationStatus;

import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateCompanyVerificationRequest {

    @NotNull(message = "Verification status is required")
    private VerificationStatus verificationStatus;
}
