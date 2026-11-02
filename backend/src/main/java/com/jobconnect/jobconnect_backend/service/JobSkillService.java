package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.entity.JobSkill;
import com.jobconnect.jobconnect_backend.repository.JobSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobSkillService {

    private final JobSkillRepository repository;

    public JobSkillService(JobSkillRepository repository) {
        this.repository = repository;
    }

    public JobSkill getById(JobSkill.JobSkillId id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job skill not found"));
    }

    public List<JobSkill> getAll() {
        return repository.findAll();
    }
}