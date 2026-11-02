
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.AdminJobResponse;
import com.jobconnect.jobconnect_backend.entity.Job;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.entity.enums.AccountStatus;
import com.jobconnect.jobconnect_backend.entity.enums.Role;
import com.jobconnect.jobconnect_backend.repository.JobRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminJobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public AdminJobService(
            JobRepository jobRepository,
            UserRepository userRepository) {

        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    private void verifyAdmin(String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Admin account not found"
                        ));

        if (admin.getRole() != Role.ADMIN ||
                admin.getAccountStatus() != AccountStatus.ACTIVE) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only active administrators can manage jobs"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> getAllJobs(String adminEmail) {

        verifyAdmin(adminEmail);

        return jobRepository.findAll(
                        Sort.by(Sort.Direction.DESC, "createdAt")
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminJobResponse updateJobStatus(
            String adminEmail,
            Long jobId,
            Job.JobStatus newStatus) {

        verifyAdmin(adminEmail);

        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Job status is required"
            );
        }

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Job not found"
                        ));

        job.setStatus(newStatus);
        job.setUpdatedAt(LocalDateTime.now());

        Job updatedJob = jobRepository.save(job);

        return toResponse(updatedJob);
    }

    private AdminJobResponse toResponse(Job job) {

        return new AdminJobResponse(
                job.getId(),
                job.getCompany().getId(),
                job.getCompany().getName(),
                job.getPostedBy().getUserId(),
                job.getTitle(),
                job.getDescription(),
                job.getLocation(),
                job.getJobType(),
                job.getWorkMode(),
                job.getEmploymentType(),
                job.getStatus(),
                job.getExperienceRequired(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getStipend(),
                job.getApplicationDeadline(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}
