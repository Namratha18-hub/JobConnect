package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.EducationResponse;
import com.jobconnect.jobconnect_backend.dto.EducationUpdateRequest;
import com.jobconnect.jobconnect_backend.entity.Education;
import com.jobconnect.jobconnect_backend.repository.EducationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EducationService {

    private final EducationRepository repository;

    public EducationService(EducationRepository repository) {
        this.repository = repository;
    }

    public EducationResponse getById(Long id) {
        Education education = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Education not found"));

        return toResponse(education);
    }

    public List<EducationResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EducationResponse update(
            Long id,
            EducationUpdateRequest request) {

        Education education = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Education not found"));

        education.setDegree(request.getDegree());
        education.setInstitution(request.getInstitution());
        education.setFieldOfStudy(request.getFieldOfStudy());
        education.setStartDate(request.getStartDate());
        education.setEndDate(request.getEndDate());
        education.setGrade(request.getGrade());

        Education updatedEducation = repository.save(education);

        return toResponse(updatedEducation);
    }

    private EducationResponse toResponse(Education education) {
        return new EducationResponse(
                education.getId(),
                education.getStudent().getUserId(),
                education.getInstitution(),
                education.getDegree(),
                education.getFieldOfStudy(),
                education.getStartDate(),
                education.getEndDate(),
                education.getGrade()
        );
    }
}