package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.SavedJobRequest;
import com.jobconnect.jobconnect_backend.dto.SavedJobResponse;
import com.jobconnect.jobconnect_backend.entity.SavedJob;
import com.jobconnect.jobconnect_backend.service.SavedJobService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-jobs")
public class SavedJobController {

    private final SavedJobService service;

    public SavedJobController(SavedJobService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SavedJobResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{studentId}/{jobId}")
    public ResponseEntity<SavedJobResponse> getById(
            @PathVariable Long studentId,
            @PathVariable Long jobId) {

        SavedJob.SavedJobId id =
                new SavedJob.SavedJobId(studentId, jobId);

        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<SavedJobResponse> create(
            @Valid @RequestBody SavedJobRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    @DeleteMapping("/{studentId}/{jobId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long studentId,
            @PathVariable Long jobId) {

        service.delete(studentId, jobId);

        return ResponseEntity.noContent().build();
    }
}