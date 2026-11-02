package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.AdminApplicationResponse;
import com.jobconnect.jobconnect_backend.service.AdminApplicationService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApplicationController {

    private final AdminApplicationService adminApplicationService;

    public AdminApplicationController(
            AdminApplicationService adminApplicationService
    ) {
        this.adminApplicationService = adminApplicationService;
    }

    @GetMapping
    public ResponseEntity<List<AdminApplicationResponse>>
    getAllApplications() {

        return ResponseEntity.ok(
                adminApplicationService.getAllApplications()
        );
    }
}