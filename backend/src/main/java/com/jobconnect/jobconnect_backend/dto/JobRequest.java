package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Job.EmploymentType;
import com.jobconnect.jobconnect_backend.entity.Job.JobStatus;
import com.jobconnect.jobconnect_backend.entity.Job.JobType;
import com.jobconnect.jobconnect_backend.entity.Job.WorkMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JobRequest {

    @NotNull
    private Long companyId;

    @NotNull
    private Long postedBy;

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    private String description;

    @Size(max = 150)
    private String location;

    @NotNull
    private JobType jobType;

    @NotNull
    private WorkMode workMode;

    private EmploymentType employmentType;

    @Size(max = 100)
    private String experienceRequired;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private BigDecimal stipend;

    private String requirements;
    private String responsibilities;

    private LocalDate applicationDeadline;

    private JobStatus status;
}