package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.AdminApplicationResponse;
import com.jobconnect.jobconnect_backend.entity.Application;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.Job;
import com.jobconnect.jobconnect_backend.repository.ApplicationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminApplicationService {

    private final ApplicationRepository applicationRepository;

    public AdminApplicationService(
            ApplicationRepository applicationRepository
    ) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminApplicationResponse> getAllApplications() {

        return applicationRepository
                .findAllByOrderByAppliedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AdminApplicationResponse toResponse(
            Application application
    ) {

        StudentProfile student = application.getStudent();
        Job job = application.getJob();

        String companyName = job.getCompany() != null
                ? job.getCompany().getName()
                : "Unknown company";

        return new AdminApplicationResponse(
                application.getId(),

                student.getUserId(),
                student.getUser().getName(),
                student.getUser().getEmail(),
                student.getLocation(),

                job.getId(),
                job.getTitle(),
                companyName,

                application.getStatus().name(),

                application.getAppliedAt(),
                application.getUpdatedAt()
        );
    }
}