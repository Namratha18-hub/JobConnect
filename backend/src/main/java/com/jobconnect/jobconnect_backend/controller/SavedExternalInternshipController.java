package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.SavedExternalInternshipRequest;
import com.jobconnect.jobconnect_backend.dto.SavedExternalInternshipResponse;
import com.jobconnect.jobconnect_backend.service.SavedExternalInternshipService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-external-internships")
public class SavedExternalInternshipController {

    private final SavedExternalInternshipService service;

    public SavedExternalInternshipController(
            SavedExternalInternshipService service) {
        this.service = service;
    }

    /*
     * GET /api/saved-external-internships
     * Returns saved external internships for the authenticated student.
     */
    @GetMapping
    public ResponseEntity<List<SavedExternalInternshipResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /*
     * POST /api/saved-external-internships
     * Saves an external internship for the authenticated student.
     */
    @PostMapping
    public ResponseEntity<SavedExternalInternshipResponse> create(
            @Valid @RequestBody SavedExternalInternshipRequest request) {

        SavedExternalInternshipResponse response =
                service.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * DELETE /api/saved-external-internships/{externalInternshipId}
     * Removes an external internship from the student's saved list.
     */
    @DeleteMapping("/{externalInternshipId}")
    public ResponseEntity<Void> delete(
            @PathVariable String externalInternshipId) {

        service.delete(externalInternshipId);

        return ResponseEntity.noContent().build();
    }
}