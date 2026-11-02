
package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Job;

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
public class AdminJobResponse {

    private Long id;

    private Long companyId;
    private String companyName;

    private Long recruiterUserId;

    private String title;
    private String description;
    private String location;

    private Job.JobType jobType;
    private Job.WorkMode workMode;
    private Job.EmploymentType employmentType;
    private Job.JobStatus status;

    private String experienceRequired;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private BigDecimal stipend;

    private LocalDate applicationDeadline;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
