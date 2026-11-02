package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.EducationResponse;
import com.jobconnect.jobconnect_backend.dto.EducationUpdateRequest;
import com.jobconnect.jobconnect_backend.service.EducationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/education")
public class EducationController {

    private final EducationService service;

    public EducationController(EducationService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<EducationResponse> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<EducationResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EducationResponse> update(
            @PathVariable Long id,
            @RequestBody EducationUpdateRequest request) {

        return ResponseEntity.ok(service.update(id, request));
    }
}