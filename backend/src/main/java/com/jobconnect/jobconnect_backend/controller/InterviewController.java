
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.InterviewRequest;
import com.jobconnect.jobconnect_backend.dto.InterviewResponse;
import com.jobconnect.jobconnect_backend.entity.Interview;
import com.jobconnect.jobconnect_backend.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService service;

    public InterviewController(InterviewService service) {
        this.service = service;
    }

    // Get one interview
    @GetMapping("/{id}")
    public ResponseEntity<InterviewResponse> getById(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.getById(id, principal.getName())
        );
    }

    // Get interviews visible to the logged-in user
    @GetMapping
    public ResponseEntity<List<InterviewResponse>> getAll(
            Principal principal) {

        return ResponseEntity.ok(
                service.getAll(principal.getName())
        );
    }

    // Schedule a new interview
    @PostMapping
    public ResponseEntity<InterviewResponse> create(
            @Valid @RequestBody InterviewRequest request,
            Principal principal) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                service.create(request, principal.getName())
        );
    }

    // Reschedule an existing interview
    @PutMapping("/{id}")
    public ResponseEntity<InterviewResponse> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody InterviewRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                service.reschedule(id, request, principal.getName())
        );
    }

    // Cancel an interview or mark it as completed
    @PatchMapping("/{id}/status")
    public ResponseEntity<InterviewResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Interview.Status status,
            Principal principal) {

        return ResponseEntity.ok(
                service.updateStatus(id, status, principal.getName())
        );
    }
}
