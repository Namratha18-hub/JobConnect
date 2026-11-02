
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.AdminJobResponse;
import com.jobconnect.jobconnect_backend.dto.UpdateJobStatusRequest;
import com.jobconnect.jobconnect_backend.service.AdminJobService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/jobs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

    private final AdminJobService adminJobService;

    public AdminJobController(AdminJobService adminJobService) {
        this.adminJobService = adminJobService;
    }

    @GetMapping
    public ResponseEntity<List<AdminJobResponse>> getAllJobs(
            Authentication authentication) {

        return ResponseEntity.ok(
                adminJobService.getAllJobs(authentication.getName())
        );
    }

    @PatchMapping("/{jobId}/status")
    public ResponseEntity<AdminJobResponse> updateJobStatus(
            Authentication authentication,
            @PathVariable Long jobId,
            @Valid @RequestBody UpdateJobStatusRequest request) {

        return ResponseEntity.ok(
                adminJobService.updateJobStatus(
                        authentication.getName(),
                        jobId,
                        request.getStatus()
                )
        );
    }
}
