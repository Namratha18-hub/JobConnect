package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.RecruiterProfileResponse;
import com.jobconnect.jobconnect_backend.service.RecruiterProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruiter-profiles")
public class RecruiterProfileController {

    private final RecruiterProfileService service;

    public RecruiterProfileController(RecruiterProfileService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecruiterProfileResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<RecruiterProfileResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }
}