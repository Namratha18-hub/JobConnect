package com.jobconnect.jobconnect_backend.entity.external;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "external_internships",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_external_internship_source_id",
                        columnNames = {"source", "external_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalInternship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ============================================================
    // SOURCE INFORMATION
    // ============================================================

    @Column(
            nullable = false,
            length = 50
    )
    private String source;

    @Column(
            name = "external_id",
            nullable = false,
            length = 120
    )
    private String externalId;

    // ============================================================
    // INTERNSHIP BASIC INFORMATION
    // ============================================================

    @Column(
            nullable = false,
            length = 180
    )
    private String title;

    @Column(
            name = "company_name",
            nullable = false,
            length = 180
    )
    private String companyName;

    @Column(
            columnDefinition = "TEXT"
    )
    private String description;

    @Column(
            length = 160
    )
    private String location;

    @Column(
            name = "work_mode",
            length = 30
    )
    private String workMode;

    @Column(
            length = 100
    )
    private String duration;

    @Column(
            name = "pay_display",
            length = 120
    )
    private String payDisplay;

    @Column(
            name = "application_deadline"
    )
    private LocalDate applicationDeadline;

    // ============================================================
    // DOMAIN
    // ============================================================

    @Column(
            nullable = false,
            length = 80
    )
    private String domain;

    // ============================================================
    // INTERNSHIP CATEGORY
    // ============================================================

    /**
     * Main internship category.
     *
     * Examples:
     *
     * SOFTWARE_DEVELOPMENT
     * JAVA_DEVELOPMENT
     * PYTHON_DEVELOPMENT
     * WEB_DEVELOPMENT
     * FRONTEND_DEVELOPMENT
     * BACKEND_DEVELOPMENT
     * FULL_STACK_DEVELOPMENT
     * DATA_SCIENCE
     * DATA_ANALYTICS
     * AI_MACHINE_LEARNING
     * GENERATIVE_AI
     * CLOUD_DEVOPS
     * CYBERSECURITY
     * DATABASE
     * TESTING_QA
     * MOBILE_DEVELOPMENT
     * UI_UX
     * GENERAL
     */
    @Column(
            name = "category",
            length = 80
    )
    @Builder.Default
    private String category = "GENERAL";

    // ============================================================
    // B.TECH YEAR ELIGIBILITY
    // ============================================================

    /**
     * B.Tech undergraduate year eligibility.
     *
     * Examples:
     *
     * 1ST_YEAR
     * 2ND_YEAR
     * 3RD_YEAR
     * 4TH_YEAR
     *
     * Multiple years:
     *
     * 1ST_YEAR,2ND_YEAR
     * 2ND_YEAR,3RD_YEAR
     * 3RD_YEAR,4TH_YEAR
     *
     * GENERAL means the external source did not explicitly
     * mention a particular undergraduate year.
     */
    @Column(
            name = "eligible_years",
            length = 120
    )
    @Builder.Default
    private String eligibleYears = "GENERAL";

    // ============================================================
    // ORIGINAL EXTERNAL LISTING
    // ============================================================

    @Column(
            name = "external_apply_url",
            nullable = false,
            length = 1000
    )
    private String externalApplyUrl;

    // ============================================================
    // STATUS
    // ============================================================

    @Column(
            nullable = false,
            length = 20
    )
    @Builder.Default
    private String status = "LIVE";

    // ============================================================
    // TIMESTAMPS
    // ============================================================

    @Column(
            name = "first_seen_at",
            nullable = false
    )
    @Builder.Default
    private LocalDateTime firstSeenAt =
            LocalDateTime.now();

    @Column(
            name = "last_seen_at",
            nullable = false
    )
    @Builder.Default
    private LocalDateTime lastSeenAt =
            LocalDateTime.now();

    @Column(
            name = "last_verified_at",
            nullable = false
    )
    @Builder.Default
    private LocalDateTime lastVerifiedAt =
            LocalDateTime.now();

    @Column(
            name = "created_at",
            nullable = false
    )
    @Builder.Default
    private LocalDateTime createdAt =
            LocalDateTime.now();

    @Column(
            name = "updated_at",
            nullable = false
    )
    @Builder.Default
    private LocalDateTime updatedAt =
            LocalDateTime.now();
}