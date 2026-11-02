package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.CompanyResponse;
import com.jobconnect.jobconnect_backend.entity.Company;
import com.jobconnect.jobconnect_backend.repository.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    // Get all companies
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Get company by ID
    public CompanyResponse getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        return toResponse(company);
    }

    // Convert Company entity to CompanyResponse
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