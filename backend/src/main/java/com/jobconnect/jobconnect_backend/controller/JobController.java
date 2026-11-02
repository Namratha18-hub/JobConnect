package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.JobRequest;
import com.jobconnect.jobconnect_backend.dto.JobResponse;
import com.jobconnect.jobconnect_backend.service.JobService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService service;

    public JobController(JobService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                service.getById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAll() {

        return ResponseEntity.ok(
                service.getAll()
        );
    }

    @PostMapping
    public ResponseEntity<JobResponse> create(
            @Valid @RequestBody JobRequest request
    ) {

        JobResponse response =
                service.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody JobRequest request,
            @RequestParam Long recruiterUserId
    ) {

        return ResponseEntity.ok(
                service.update(
                        id,
                        request,
                        recruiterUserId
                )
        );
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<JobResponse> close(
            @PathVariable Long id,
            @RequestParam Long recruiterUserId
    ) {

        return ResponseEntity.ok(
                service.close(
                        id,
                        recruiterUserId
                )
        );
    }
}