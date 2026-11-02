
package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateUserStatusRequest {

    @NotNull(message = "Account status is required")
    private AccountStatus status;
}
