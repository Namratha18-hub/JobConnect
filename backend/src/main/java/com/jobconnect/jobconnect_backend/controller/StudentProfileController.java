package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.StudentProfileResponse;
import com.jobconnect.jobconnect_backend.dto.StudentProfileUpdateRequest;
import com.jobconnect.jobconnect_backend.service.StudentProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-profiles")
public class StudentProfileController {

    private final StudentProfileService service;

    public StudentProfileController(StudentProfileService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentProfileResponse> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<StudentProfileResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentProfileResponse> update(
            @PathVariable Long id,
            @RequestBody StudentProfileUpdateRequest request) {

        return ResponseEntity.ok(service.update(id, request));
    }
}