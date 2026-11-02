package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.entity.JobSkill;
import com.jobconnect.jobconnect_backend.service.JobSkillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-skills")
public class JobSkillController {

    private final JobSkillService service;

    public JobSkillController(JobSkillService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<JobSkill>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{jobId}/{skillId}")
    public ResponseEntity<JobSkill> getById(
            @PathVariable Long jobId,
            @PathVariable Long skillId) {

        JobSkill.JobSkillId id =
                new JobSkill.JobSkillId(jobId, skillId);

        return ResponseEntity.ok(service.getById(id));
    }
}