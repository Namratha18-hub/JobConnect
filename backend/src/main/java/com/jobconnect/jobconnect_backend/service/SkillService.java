package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.entity.Skill;
import com.jobconnect.jobconnect_backend.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository repository;

    public SkillService(SkillRepository repository) {
        this.repository = repository;
    }

    public Skill getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
    }

    public List<Skill> getAll() {
        return repository.findAll();
    }
}