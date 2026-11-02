package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.ExperienceResponse;
import com.jobconnect.jobconnect_backend.dto.ExperienceUpdateRequest;
import com.jobconnect.jobconnect_backend.entity.Experience;
import com.jobconnect.jobconnect_backend.repository.ExperienceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExperienceService {

    private final ExperienceRepository repository;

    public ExperienceService(ExperienceRepository repository) {
        this.repository = repository;
    }

    public ExperienceResponse getById(Long id) {
        Experience experience = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        return toResponse(experience);
    }

    public List<ExperienceResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ExperienceResponse update(
            Long id,
            ExperienceUpdateRequest request) {

        Experience experience = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        experience.setCompanyName(request.getCompanyName());
        experience.setJobTitle(request.getJobTitle());
        experience.setDescription(request.getDescription());
        experience.setStartDate(request.getStartDate());
        experience.setEndDate(request.getEndDate());

        Experience updatedExperience = repository.save(experience);

        return toResponse(updatedExperience);
    }

    private ExperienceResponse toResponse(Experience experience) {
        return new ExperienceResponse(
                experience.getId(),
                experience.getStudent().getUserId(),
                experience.getCompanyName(),
                experience.getJobTitle(),
                experience.getDescription(),
                experience.getStartDate(),
                experience.getEndDate()
        );
    }
}