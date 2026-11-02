package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Job.EmploymentType;
import com.jobconnect.jobconnect_backend.entity.Job.JobStatus;
import com.jobconnect.jobconnect_backend.entity.Job.JobType;
import com.jobconnect.jobconnect_backend.entity.Job.WorkMode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {

    private Long id;
    private Long companyId;
    private Long postedBy;
    private String title;
    private String description;
    private String location;
    private JobType jobType;
    private WorkMode workMode;
    private EmploymentType employmentType;
    private String experienceRequired;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private BigDecimal stipend;
    private String requirements;
    private String responsibilities;
    private LocalDate applicationDeadline;
    private JobStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}