
package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Job;

import jakarta.validation.constraints.NotNull;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateJobStatusRequest {

    @NotNull(message = "Job status is required")
    private Job.JobStatus status;
}
