package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.ResumeResponse;
import com.jobconnect.jobconnect_backend.service.ResumeService;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService service;

    public ResumeController(ResumeService service) {
        this.service = service;
    }

    // Get a specific resume after checking access permissions.
    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> getById(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.getById(id, principal.getName())
        );
    }

    // Get resumes visible to the authenticated user.
    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getAll(
            Principal principal) {

        return ResponseEntity.ok(
                service.getAll(principal.getName())
        );
    }

    // Only students can upload resumes.
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            Principal principal) throws IOException {

        ResumeResponse response =
                service.upload(file, principal.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}