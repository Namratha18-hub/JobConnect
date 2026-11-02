
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.CompanyResponse;
import com.jobconnect.jobconnect_backend.dto.UpdateCompanyVerificationRequest;
import com.jobconnect.jobconnect_backend.service.AdminCompanyService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/companies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCompanyController {

    private final AdminCompanyService adminCompanyService;

    public AdminCompanyController(
            AdminCompanyService adminCompanyService) {

        this.adminCompanyService = adminCompanyService;
    }

    // GET: View all registered companies.
    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllCompanies(
            Authentication authentication) {

        return ResponseEntity.ok(
                adminCompanyService.getAllCompanies(
                        authentication.getName()
                )
        );
    }

    // PATCH: Approve, reject or return a company to pending.
    @PatchMapping("/{companyId}/verification")
    public ResponseEntity<CompanyResponse> updateVerificationStatus(
            Authentication authentication,
            @PathVariable Long companyId,
            @Valid @RequestBody UpdateCompanyVerificationRequest request) {

        return ResponseEntity.ok(
                adminCompanyService.updateVerificationStatus(
                        authentication.getName(),
                        companyId,
                        request.getVerificationStatus()
                )
        );
    }
}
