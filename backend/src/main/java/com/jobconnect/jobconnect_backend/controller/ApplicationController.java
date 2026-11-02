package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.ApplicationRequest;
import com.jobconnect.jobconnect_backend.dto.ApplicationResponse;
import com.jobconnect.jobconnect_backend.dto.ApplicationStatusRequest;
import com.jobconnect.jobconnect_backend.dto.RecruiterApplicationResponse;
import com.jobconnect.jobconnect_backend.service.ApplicationService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    // Students can retrieve only their own applications.
    // Administrators may retrieve applications for administration.
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApplicationResponse> getById(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.getById(id, principal.getName())
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponse>> getAll(
            Principal principal) {

        return ResponseEntity.ok(
                service.getAll(principal.getName())
        );
    }

    // Students can apply only as themselves.
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationResponse> create(
            @Valid @RequestBody ApplicationRequest request,
            Principal principal) {

        return ResponseEntity.status(201)
                .body(
                        service.create(
                                request,
                                principal.getName()
                        )
                );
    }

    // Recruiters can view applications for their own jobs.
    @GetMapping("/recruiter")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<List<RecruiterApplicationResponse>>
    getRecruiterApplications(Principal principal) {

        return ResponseEntity.ok(
                service.getRecruiterApplications(
                        principal.getName()
                )
        );
    }

    // Recruiters can update statuses only for their own jobs.
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<RecruiterApplicationResponse>
    updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationStatusRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                service.updateStatus(
                        id,
                        request,
                        principal.getName()
                )
        );
    }
}