package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Application;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusRequest {

    @NotNull
    private Application.Status status;
}