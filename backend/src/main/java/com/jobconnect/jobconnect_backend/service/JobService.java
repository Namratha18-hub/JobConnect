package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.JobRequest;
import com.jobconnect.jobconnect_backend.dto.JobResponse;
import com.jobconnect.jobconnect_backend.entity.Company;
import com.jobconnect.jobconnect_backend.entity.Job;
import com.jobconnect.jobconnect_backend.entity.RecruiterProfile;
import com.jobconnect.jobconnect_backend.repository.CompanyRepository;
import com.jobconnect.jobconnect_backend.repository.JobRepository;
import com.jobconnect.jobconnect_backend.repository.RecruiterProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class JobService {

    private final JobRepository repository;
    private final CompanyRepository companyRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    public JobService(
            JobRepository repository,
            CompanyRepository companyRepository,
            RecruiterProfileRepository recruiterProfileRepository
    ) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.recruiterProfileRepository = recruiterProfileRepository;
    }

    public JobResponse getById(Long id) {

        Job job = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found")
                );

        return toResponse(job);
    }

    public List<JobResponse> getAll() {

        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public JobResponse create(JobRequest request) {

        validateDeadline(request.getApplicationDeadline());

        Company company = companyRepository.findById(
                        request.getCompanyId()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Company not found."
                        )
                );

        RecruiterProfile recruiter =
                recruiterProfileRepository.findById(
                        request.getPostedBy()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Recruiter profile not found."
                        )
                );

        Job job = new Job();

        applyRequestToJob(
                job,
                request,
                company,
                recruiter
        );

        LocalDateTime now = LocalDateTime.now();

        job.setCreatedAt(now);
        job.setUpdatedAt(now);

        Job savedJob = repository.save(job);

        return toResponse(savedJob);
    }

    @Transactional
    public JobResponse update(
            Long id,
            JobRequest request,
            Long recruiterUserId
    ) {

        Job job = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found")
                );

        // Make sure this recruiter owns the job
        if (!job.getPostedBy()
                .getUserId()
                .equals(recruiterUserId)) {

            throw new IllegalArgumentException(
                    "You are not authorized to update this job."
            );
        }

        if (job.getStatus() == Job.JobStatus.CLOSED) {

            throw new IllegalArgumentException(
                    "Closed jobs cannot be edited."
            );
        }

        validateDeadline(request.getApplicationDeadline());

        Company company = companyRepository.findById(
                        request.getCompanyId()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Company not found."
                        )
                );

        applyRequestToJob(
                job,
                request,
                company,
                job.getPostedBy()
        );

        job.setUpdatedAt(
                LocalDateTime.now()
        );

        Job updatedJob =
                repository.save(job);

        return toResponse(updatedJob);
    }

    @Transactional
    public JobResponse close(
            Long id,
            Long recruiterUserId
    ) {

        Job job = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found")
                );

        // Make sure this recruiter owns the job
        if (!job.getPostedBy()
                .getUserId()
                .equals(recruiterUserId)) {

            throw new IllegalArgumentException(
                    "You are not authorized to close this job."
            );
        }

        if (job.getStatus() == Job.JobStatus.CLOSED) {

            throw new IllegalArgumentException(
                    "Job is already closed."
            );
        }

        job.setStatus(
                Job.JobStatus.CLOSED
        );

        job.setUpdatedAt(
                LocalDateTime.now()
        );

        Job closedJob =
                repository.save(job);

        return toResponse(closedJob);
    }

    private void applyRequestToJob(
            Job job,
            JobRequest request,
            Company company,
            RecruiterProfile recruiter
    ) {

        Job.JobType jobType =
                request.getJobType();

        Job.EmploymentType employmentType =
                request.getEmploymentType();

        BigDecimal stipend =
                request.getStipend();

        BigDecimal salaryMin =
                request.getSalaryMin();

        BigDecimal salaryMax =
                request.getSalaryMax();

        /*
         * INTERNSHIP
         */
        if (jobType == Job.JobType.INTERNSHIP) {

            employmentType =
                    Job.EmploymentType.INTERNSHIP;

            salaryMin = null;
            salaryMax = null;

            if (stipend == null
                    || stipend.compareTo(BigDecimal.ZERO) <= 0) {

                throw new IllegalArgumentException(
                        "A paid internship must have a stipend greater than zero."
                );
            }
        }

        /*
         * JOB
         */
        else {

            if (employmentType == null
                    || employmentType ==
                    Job.EmploymentType.INTERNSHIP) {

                employmentType =
                        Job.EmploymentType.FULL_TIME;
            }

            stipend = null;

            if (salaryMin != null
                    && salaryMax != null
                    && salaryMax.compareTo(salaryMin) < 0) {

                throw new IllegalArgumentException(
                        "Maximum salary cannot be less than minimum salary."
                );
            }
        }

        Job.JobStatus status =
                request.getStatus() == null
                        ? Job.JobStatus.PUBLISHED
                        : request.getStatus();

        job.setCompany(company);
        job.setPostedBy(recruiter);

        job.setTitle(
                request.getTitle().trim()
        );

        job.setDescription(
                request.getDescription().trim()
        );

        job.setLocation(
                request.getLocation() == null
                        ? null
                        : request.getLocation().trim()
        );

        job.setJobType(jobType);
        job.setWorkMode(request.getWorkMode());
        job.setEmploymentType(employmentType);

        job.setExperienceRequired(
                request.getExperienceRequired() == null
                        ? null
                        : request.getExperienceRequired().trim()
        );

        job.setSalaryMin(salaryMin);
        job.setSalaryMax(salaryMax);
        job.setStipend(stipend);

        job.setRequirements(
                request.getRequirements() == null
                        ? null
                        : request.getRequirements().trim()
        );

        job.setResponsibilities(
                request.getResponsibilities() == null
                        ? null
                        : request.getResponsibilities().trim()
        );

        job.setApplicationDeadline(
                request.getApplicationDeadline()
        );

        job.setStatus(status);
    }

    private void validateDeadline(
            LocalDate deadline
    ) {

        if (deadline == null) {

            throw new IllegalArgumentException(
                    "Application deadline is required."
            );
        }

        if (deadline.isBefore(LocalDate.now())) {

            throw new IllegalArgumentException(
                    "Application deadline cannot be in the past."
            );
        }
    }

    private JobResponse toResponse(Job job) {

        return new JobResponse(
                job.getId(),
                job.getCompany().getId(),
                job.getPostedBy().getUserId(),
                job.getTitle(),
                job.getDescription(),
                job.getLocation(),
                job.getJobType(),
                job.getWorkMode(),
                job.getEmploymentType(),
                job.getExperienceRequired(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getStipend(),
                job.getRequirements(),
                job.getResponsibilities(),
                job.getApplicationDeadline(),
                job.getStatus(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}