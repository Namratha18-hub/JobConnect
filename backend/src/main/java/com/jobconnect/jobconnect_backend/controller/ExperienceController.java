package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.ExperienceResponse;
import com.jobconnect.jobconnect_backend.dto.ExperienceUpdateRequest;
import com.jobconnect.jobconnect_backend.service.ExperienceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experience")
public class ExperienceController {

    private final ExperienceService service;

    public ExperienceController(ExperienceService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExperienceResponse> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ExperienceResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExperienceResponse> update(
            @PathVariable Long id,
            @RequestBody ExperienceUpdateRequest request) {

        return ResponseEntity.ok(service.update(id, request));
    }
}