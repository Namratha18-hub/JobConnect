
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.CompanyResponse;
import com.jobconnect.jobconnect_backend.entity.Company;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.entity.enums.AccountStatus;
import com.jobconnect.jobconnect_backend.entity.enums.Role;
import com.jobconnect.jobconnect_backend.entity.enums.VerificationStatus;
import com.jobconnect.jobconnect_backend.repository.CompanyRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminCompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public AdminCompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository) {

        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    // Verify that the current account is an active administrator.
    private void verifyAdmin(String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Admin account not found"
                        ));

        if (admin.getRole() != Role.ADMIN ||
                admin.getAccountStatus() != AccountStatus.ACTIVE) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only active administrators can manage companies"
            );
        }
    }

    // Retrieve all registered companies.
    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllCompanies(String adminEmail) {

        verifyAdmin(adminEmail);

        return companyRepository.findAll(
                        Sort.by(Sort.Direction.DESC, "createdAt")
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Update company verification status.
    @Transactional
    public CompanyResponse updateVerificationStatus(
            String adminEmail,
            Long companyId,
            VerificationStatus newStatus) {

        verifyAdmin(adminEmail);

        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Verification status is required"
            );
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Company not found"
                        ));

        company.setVerificationStatus(newStatus);
        company.setUpdatedAt(LocalDateTime.now());

        Company updatedCompany = companyRepository.save(company);

        return toResponse(updatedCompany);
    }

    // Convert entity to response DTO.
    private CompanyResponse toResponse(Company company) {

        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getIndustry(),
                company.getDescription(),
                company.getWebsite(),
                company.getLocation(),
                company.getCompanySize(),
                company.getVerificationStatus(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}
