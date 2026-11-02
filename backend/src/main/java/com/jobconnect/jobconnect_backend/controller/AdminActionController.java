package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.AdminActionRequest;
import com.jobconnect.jobconnect_backend.dto.AdminActionResponse;
import com.jobconnect.jobconnect_backend.service.AdminActionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin-actions")
public class AdminActionController {

    private final AdminActionService service;

    public AdminActionController(AdminActionService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminActionResponse> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<AdminActionResponse>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<AdminActionResponse> create(
            @Valid @RequestBody AdminActionRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(request));
    }
}