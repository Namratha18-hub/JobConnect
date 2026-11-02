package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.ExternalInternshipResponse;
import com.jobconnect.jobconnect_backend.entity.external.ExternalInternship;
import com.jobconnect.jobconnect_backend.repository.ExternalInternshipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/external-internships")
public class ExternalInternshipController {

    private final ExternalInternshipRepository repository;

    public ExternalInternshipController(
            ExternalInternshipRepository repository
    ) {
        this.repository = repository;
    }

    // ============================================================
    // GET LIVE EXTERNAL INTERNSHIPS
    // ============================================================

    @GetMapping
    public ResponseEntity<List<ExternalInternshipResponse>>
    getLiveInternships() {

        LocalDate today =
                LocalDate.now();

        List<ExternalInternshipResponse> response =
                repository
                        .findByStatusOrderByLastVerifiedAtDesc(
                                "LIVE"
                        )
                        .stream()
                        .filter(
                                internship ->
                                        internship
                                                .getApplicationDeadline()
                                                == null
                                                ||
                                        !internship
                                                .getApplicationDeadline()
                                                .isBefore(today)
                        )
                        .map(
                                this::toResponse
                        )
                        .toList();

        return ResponseEntity.ok(
                response
        );
    }

    // ============================================================
    // ENTITY -> RESPONSE
    // ============================================================

    private ExternalInternshipResponse toResponse(
            ExternalInternship internship
    ) {

        String deadline =
                internship.getApplicationDeadline() == null
                        ? null
                        : internship
                                .getApplicationDeadline()
                                .toString();

        String verifiedOn =
                internship.getLastVerifiedAt() == null
                        ? null
                        : internship
                                .getLastVerifiedAt()
                                .toLocalDate()
                                .toString();

        return new ExternalInternshipResponse(

                String.valueOf(
                        internship.getId()
                ),

                internship.getTitle(),

                internship.getCompanyName(),

                internship.getLocation(),

                internship.getWorkMode(),

                internship.getDuration(),

                internship.getPayDisplay(),

                deadline,

                internship.getDomain(),

                internship.getCategory(),

                internship.getEligibleYears(),

                internship.getSource(),

                internship.getExternalApplyUrl(),

                verifiedOn,

                "Automatically updated from live source"
        );
    }
}