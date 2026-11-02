package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.RecruiterProfileResponse;
import com.jobconnect.jobconnect_backend.entity.RecruiterProfile;
import com.jobconnect.jobconnect_backend.repository.RecruiterProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecruiterProfileService {

    private final RecruiterProfileRepository repository;

    public RecruiterProfileService(RecruiterProfileRepository repository) {
        this.repository = repository;
    }

    public RecruiterProfileResponse getById(Long id) {
        RecruiterProfile profile = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recruiter profile not found"));

        return toResponse(profile);
    }

    public List<RecruiterProfileResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RecruiterProfileResponse toResponse(RecruiterProfile profile) {
        return new RecruiterProfileResponse(
                profile.getUserId(),
                profile.getCompany().getId(),
                profile.getDesignation()
        );
    }
}