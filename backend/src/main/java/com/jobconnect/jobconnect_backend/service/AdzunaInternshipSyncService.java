package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.entity.external.ExternalInternship;
import com.jobconnect.jobconnect_backend.repository.ExternalInternshipRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AdzunaInternshipSyncService {

    private static final Logger log =
            LoggerFactory.getLogger(
                    AdzunaInternshipSyncService.class
            );

    private static final String SOURCE = "ADZUNA";

    private static final Pattern DURATION_PATTERN =
            Pattern.compile(
                    "(\\d+)\\s*-?\\s*(months?|weeks?)"
            );

    private final ExternalInternshipRepository repository;

    private final JsonMapper jsonMapper;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .build();

    @Value("${adzuna.enabled:false}")
    private boolean enabled;

    @Value("${adzuna.app-id:}")
    private String appId;

    @Value("${adzuna.app-key:}")
    private String appKey;

    @Value(
            "${adzuna.base-url:https://api.adzuna.com/v1/api}"
    )
    private String baseUrl;

    @Value("${adzuna.country:in}")
    private String country;

    @Value("${adzuna.results-per-page:30}")
    private int resultsPerPage;

    public AdzunaInternshipSyncService(
            ExternalInternshipRepository repository,
            JsonMapper jsonMapper
    ) {
        this.repository = repository;
        this.jsonMapper = jsonMapper;
    }

    // ============================================================
    // STARTUP
    // ============================================================

    @PostConstruct
    public void initialize() {

        log.info(
                "Initializing JobConnect external internship service..."
        );

        /*
         * IMPORTANT:
         *
         * This runs independently of Adzuna.
         *
         * Therefore existing database records are classified
         * even if the external API is temporarily unavailable.
         */
        try {

            int updated =
                    classifyExistingInternships();

            log.info(
                    "Startup internship classification completed. "
                            + "{} record(s) updated.",
                    updated
            );

        } catch (Exception exception) {

            log.error(
                    "Startup internship classification failed.",
                    exception
            );
        }

        validateConfiguration();
    }

    // ============================================================
    // ADZUNA CONFIGURATION CHECK
    // ============================================================

    private void validateConfiguration() {

        if (!enabled) {

            log.info(
                    "Adzuna internship feed is disabled."
            );

            return;
        }

        if (!isConfigured()) {

            log.warn(
                    "Adzuna is enabled, but ADZUNA_APP_ID or "
                            + "ADZUNA_APP_KEY is missing."
            );

            return;
        }

        log.info(
                "Adzuna internship feed is configured."
        );
    }

    // ============================================================
    // SCHEDULED ADZUNA SYNCHRONIZATION
    // ============================================================

    @Scheduled(
            initialDelayString =
                    "${adzuna.initial-delay-ms:30000}",
            fixedDelayString =
                    "${adzuna.refresh-delay-ms:86400000}"
    )
    @Transactional
    public void scheduledSync() {

        if (!isConfigured()) {

            /*
             * Even when Adzuna is unavailable, make sure
             * existing records stay classified.
             */
            int updated =
                    classifyExistingInternships();

            if (updated > 0) {

                log.info(
                        "Existing internship classification updated "
                                + "{} record(s) while Adzuna was unavailable.",
                        updated
                );
            }

            return;
        }

        try {

            int processed =
                    syncExternalInternships();

            log.info(
                    "Adzuna scheduled sync completed. "
                            + "{} internship(s) processed.",
                    processed
            );

        } catch (Exception exception) {

            log.error(
                    "Adzuna scheduled synchronization failed.",
                    exception
            );

            /*
             * Still classify existing database records even
             * when the external API synchronization fails.
             */
            try {

                int updated =
                        classifyExistingInternships();

                log.info(
                        "Fallback internship classification completed. "
                                + "{} record(s) updated.",
                        updated
                );

            } catch (Exception fallbackException) {

                log.error(
                        "Fallback internship classification failed.",
                        fallbackException
                );
            }
        }
    }

    // ============================================================
    // MAIN ADZUNA SYNCHRONIZATION
    // ============================================================

    @Transactional
    public int syncExternalInternships()
            throws IOException, InterruptedException {

        if (!isConfigured()) {
            return 0;
        }

        List<String> searchTerms = List.of(

                // Software Development
                "software developer intern",
                "software engineer intern",

                // Java
                "java developer intern",
                "java software intern",
                "spring boot intern",

                // Python
                "python developer intern",
                "python software intern",
                "django intern",

                // Web
                "web developer intern",
                "web development intern",

                // Frontend
                "frontend developer intern",
                "react developer intern",

                // Backend
                "backend developer intern",
                "backend engineering intern",

                // Full Stack
                "full stack developer intern",
                "full stack web development intern",

                // Data
                "data science intern",
                "data scientist intern",
                "data analyst intern",
                "data analytics intern",

                // AI / ML
                "machine learning intern",
                "machine learning engineer intern",
                "artificial intelligence intern",

                // Generative AI
                "generative ai intern",
                "gen ai intern",
                "llm intern",

                // Cloud / DevOps
                "cloud computing intern",
                "devops intern",

                // Cybersecurity
                "cyber security intern",
                "cybersecurity intern",

                // Testing
                "software testing intern",
                "qa testing intern",

                // Database
                "database intern",
                "sql developer intern",

                // Mobile
                "android developer intern",
                "mobile app development intern",

                // UI / UX
                "ui ux design intern"
        );

        Set<String> seenExternalIds =
                new HashSet<>();

        int processedCount = 0;

        for (String searchTerm : searchTerms) {

            try {

                String responseBody =
                        fetchJobs(searchTerm);

                JsonNode root =
                        jsonMapper.readTree(
                                responseBody
                        );

                JsonNode results =
                        root.path("results");

                if (!results.isArray()) {

                    log.warn(
                            "No results array returned for search: {}",
                            searchTerm
                    );

                    continue;
                }

                for (JsonNode job : results) {

                    if (!looksLikeInternship(job)) {
                        continue;
                    }

                    if (!isCseRelevantInternship(job)) {
                        continue;
                    }

                    String externalId =
                            text(
                                    job,
                                    "id"
                            );

                    String redirectUrl =
                            text(
                                    job,
                                    "redirect_url"
                            );

                    if (
                            externalId == null
                                    || externalId.isBlank()
                                    || redirectUrl == null
                                    || redirectUrl.isBlank()
                    ) {
                        continue;
                    }

                    if (
                            !seenExternalIds.add(
                                    externalId
                            )
                    ) {
                        continue;
                    }

                    upsertInternship(job);

                    processedCount++;
                }

            } catch (Exception exception) {

                log.error(
                        "Adzuna search failed for '{}'.",
                        searchTerm,
                        exception
                );
            }
        }

        markStaleListingsExpired();

        /*
         * Always classify all existing records after a sync.
         */
        int updated =
                classifyExistingInternships();

        log.info(
                "Post-sync internship classification updated "
                        + "{} existing record(s).",
                updated
        );

        return processedCount;
    }

    // ============================================================
    // CLASSIFY ALL EXISTING DATABASE RECORDS
    // ============================================================

    @Transactional
    public int classifyExistingInternships() {

        List<ExternalInternship> internships =
                repository.findAll();

        List<ExternalInternship> changedInternships =
                new ArrayList<>();

        for (
                ExternalInternship internship :
                internships
        ) {

            String title =
                    safe(
                            internship.getTitle()
                    );

            String description =
                    safe(
                            internship.getDescription()
                    );

            // ----------------------------------------------------
            // DETECT CURRENT DOMAIN
            // ----------------------------------------------------

            // ----------------------------------------------------
            // EXCLUDE NON-INTERNSHIP / NON-CSE RECORDS ALREADY
            // IN THE DATABASE
            // ----------------------------------------------------

            if (
                    !isInternshipTitle(title)
                            || !isCseRelevantText(
                            title,
                            description
                    )
            ) {

                if (
                        "LIVE".equalsIgnoreCase(
                                internship.getStatus()
                        )
                ) {
                    internship.setStatus(
                            "EXCLUDED"
                    );

                    internship.setUpdatedAt(
                            LocalDateTime.now()
                    );

                    changedInternships.add(
                            internship
                    );
                }

                continue;
            }

            String detectedDomain =
                    detectDomain(
                            title,
                            description
                    );

            // ----------------------------------------------------
            // DETECT CURRENT CATEGORY
            // ----------------------------------------------------

            String detectedCategory =
                    detectCategory(
                            title,
                            description
                    );

            // ----------------------------------------------------
            // DETECT B.TECH YEAR ELIGIBILITY
            // ----------------------------------------------------

            String detectedYears =
                    detectEligibleYears(
                            title,
                            description
                    );

            // ----------------------------------------------------
            // CHECK DOMAIN CHANGES
            // ----------------------------------------------------

            boolean domainChanged =
                    !Objects.equals(
                            internship.getDomain(),
                            detectedDomain
                    );

            // ----------------------------------------------------
            // CHECK CATEGORY CHANGES
            // ----------------------------------------------------

            boolean categoryChanged =
                    !Objects.equals(
                            internship.getCategory(),
                            detectedCategory
                    );

            // ----------------------------------------------------
            // CHECK YEAR ELIGIBILITY CHANGES
            // ----------------------------------------------------

            boolean yearsChanged =
                    !Objects.equals(
                            internship.getEligibleYears(),
                            detectedYears
                    );

            // ----------------------------------------------------
            // UPDATE RECORD WHEN ANY VALUE CHANGED
            // ----------------------------------------------------

            if (
                    domainChanged
                            || categoryChanged
                            || yearsChanged
            ) {

                internship.setDomain(
                        detectedDomain
                );

                internship.setCategory(
                        detectedCategory
                );

                internship.setEligibleYears(
                        detectedYears
                );

                internship.setUpdatedAt(
                        LocalDateTime.now()
                );

                changedInternships.add(
                        internship
                );
            }
        }

        // --------------------------------------------------------
        // SAVE CHANGED RECORDS
        // --------------------------------------------------------

        if (
                !changedInternships.isEmpty()
        ) {

            repository.saveAll(
                    changedInternships
            );
        }

        log.info(
                "Existing internship classification completed. "
                        + "{} record(s) updated.",
                changedInternships.size()
        );

        return changedInternships.size();
    }

    // ============================================================
    // ADZUNA API REQUEST
    // ============================================================

    private String fetchJobs(
            String searchTerm
    ) throws IOException, InterruptedException {

        String encodedWhat =
                URLEncoder.encode(
                        searchTerm,
                        StandardCharsets.UTF_8
                );

        String encodedAppId =
                URLEncoder.encode(
                        appId,
                        StandardCharsets.UTF_8
                );

        String encodedAppKey =
                URLEncoder.encode(
                        appKey,
                        StandardCharsets.UTF_8
                );

        String url =
                baseUrl
                        + "/jobs/"
                        + country
                        + "/search/1"
                        + "?app_id="
                        + encodedAppId
                        + "&app_key="
                        + encodedAppKey
                        + "&results_per_page="
                        + resultsPerPage
                        + "&what="
                        + encodedWhat
                        + "&content-type=application/json";

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(url)
                        )
                        .header(
                                "Accept",
                                "application/json"
                        )
                        .GET()
                        .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (
                response.statusCode() < 200
                        || response.statusCode() >= 300
        ) {

            throw new IOException(
                    "Adzuna returned HTTP "
                            + response.statusCode()
                            + " for search: "
                            + searchTerm
            );
        }

        return response.body();
    }

    // ============================================================
    // CHECK INTERNSHIP
    // ============================================================

    private boolean looksLikeInternship(
            JsonNode job
    ) {

        String title =
                text(
                        job,
                        "title"
                );

        return isInternshipTitle(title);
    }

    private boolean isInternshipTitle(
            String title
    ) {

        String normalizedTitle =
                normalizeText(
                        title
                );

        return containsAny(
                normalizedTitle,
                "intern",
                "internship",
                "trainee"
        );
    }

    private boolean isCseRelevantInternship(
            JsonNode job
    ) {

        String title =
                normalizeText(
                        text(
                                job,
                                "title"
                        )
                );

        String description =
                normalizeText(
                        text(
                                job,
                                "description"
                        )
                );

        /*
         * Reject clearly non-CSE roles even when their description
         * happens to mention software/technology.
         */
        if (
                containsAny(
                        title,
                        "hr intern",
                        "human resources",
                        "recruitment intern",
                        "recruiter intern",
                        "talent acquisition",
                        "business development",
                        "sales intern",
                        "marketing intern",
                        "finance intern",
                        "accounting intern",
                        "legal intern",
                        "operations intern",
                        "customer support intern",
                        "customer service intern"
                )
        ) {
            return false;
        }

        String combined =
                title
                        + " "
                        + description;

        return containsAny(
                combined,
                "software developer",
                "software engineer",
                "software development",
                "software engineering",
                "developer intern",
                "programming",
                "java",
                "spring boot",
                "python",
                "django",
                "flask",
                "fastapi",
                "javascript",
                "typescript",
                "react",
                "angular",
                "vue",
                "node.js",
                "nodejs",
                "full stack",
                "full-stack",
                "fullstack",
                "frontend",
                "front-end",
                "backend",
                "back-end",
                "web developer",
                "web development",
                "data science",
                "data scientist",
                "data analyst",
                "data analytics",
                "machine learning",
                "deep learning",
                "artificial intelligence",
                "generative ai",
                "gen ai",
                "large language model",
                "llm",
                "prompt engineering",
                "cloud",
                "aws",
                "azure",
                "google cloud",
                "devops",
                "cybersecurity",
                "cyber security",
                "information security",
                "software testing",
                "qa testing",
                "quality assurance",
                "test engineer",
                "selenium",
                "database",
                "sql",
                "mysql",
                "postgresql",
                "oracle database",
                "android",
                "mobile app",
                "mobile application",
                "flutter",
                "react native",
                "ui/ux",
                "ui ux",
                "ui-ux",
                "ux/ui",
                "ux ui",
                "user experience",
                "user interface",
                "product designer",
                "product design",
                "ux designer",
                "ui designer",
                "unity",
                "ar/vr"
        );
    }

    // ============================================================
    // INSERT / UPDATE
    // ============================================================

    private void upsertInternship(
            JsonNode job
    ) {

        String externalId =
                text(
                        job,
                        "id"
                );

        if (
                externalId == null
                        || externalId.isBlank()
        ) {
            return;
        }

        ExternalInternship internship =
                repository
                        .findBySourceAndExternalId(
                                SOURCE,
                                externalId
                        )
                        .orElseGet(
                                ExternalInternship::new
                        );

        boolean isNew =
                internship.getId() == null;

        String title =
                safe(
                        text(
                                job,
                                "title"
                        )
                );

        String description =
                text(
                        job,
                        "description"
                );

        String company =
                job.path("company")
                        .path("display_name")
                        .asText(
                                "Company not disclosed"
                        );

        String location =
                job.path("location")
                        .path("display_name")
                        .asText(
                                "India"
                        );

        String redirectUrl =
                text(
                        job,
                        "redirect_url"
                );

        if (
                redirectUrl == null
                        || redirectUrl.isBlank()
        ) {
            return;
        }

        internship.setSource(
                SOURCE
        );

        internship.setExternalId(
                externalId
        );

        internship.setTitle(
                truncate(
                        title,
                        180
                )
        );

        internship.setCompanyName(
                truncate(
                        company,
                        180
                )
        );

        internship.setDescription(
                description
        );

        internship.setLocation(
                truncate(
                        location,
                        160
                )
        );

        internship.setWorkMode(
                detectWorkMode(
                        title,
                        description,
                        location
                )
        );

        internship.setDuration(
                detectDuration(
                        description
                )
        );

        internship.setPayDisplay(
                buildPayDisplay(
                        job
                )
        );

        internship.setApplicationDeadline(
                null
        );

        internship.setDomain(
                detectDomain(
                        title,
                        description
                )
        );

        internship.setCategory(
                detectCategory(
                        title,
                        description
                )
        );

        internship.setEligibleYears(
                detectEligibleYears(
                        title,
                        description
                )
        );

        internship.setExternalApplyUrl(
                truncate(
                        redirectUrl,
                        1000
                )
        );

        internship.setStatus(
                "LIVE"
        );

        LocalDateTime now =
                LocalDateTime.now();

        if (isNew) {

            internship.setFirstSeenAt(
                    now
            );

            internship.setCreatedAt(
                    now
            );
        }

        internship.setLastSeenAt(
                now
        );

        internship.setLastVerifiedAt(
                now
        );

        internship.setUpdatedAt(
                now
        );

        repository.save(
                internship
        );
    }

    // ============================================================
    // CATEGORY
    // ============================================================

    private String detectCategory(
            String title,
            String description
    ) {

        String normalizedTitle =
                normalizeText(
                        title
                );

        String normalizedDescription =
                normalizeText(
                        description
                );

        /*
         * TITLE-FIRST classification.
         * A title is treated as the strongest signal so that
         * descriptions mentioning unrelated technologies do not
         * override the actual job role.
         */

        // Generative AI
        if (
                containsAny(
                        normalizedTitle,
                        "generative ai",
                        "gen ai",
                        "large language model",
                        "large language models",
                        "llm",
                        "prompt engineering"
                )
        ) {
            return "GENERATIVE_AI";
        }

        // AI / ML
        if (
                containsAny(
                        normalizedTitle,
                        "machine learning",
                        "machine-learning",
                        "deep learning",
                        "deep-learning",
                        "artificial intelligence",
                        "ai engineer",
                        "ai/ml",
                        "ai ml",
                        "ml engineer"
                )
        ) {
            return "AI_MACHINE_LEARNING";
        }

        // Data Science
        if (
                containsAny(
                        normalizedTitle,
                        "data science",
                        "data-science",
                        "data scientist",
                        "data-scientist"
                )
        ) {
            return "DATA_SCIENCE";
        }

        // Data Analytics
        if (
                containsAny(
                        normalizedTitle,
                        "data analyst",
                        "data-analyst",
                        "data analytics",
                        "data-analytics",
                        "data analysis",
                        "business analyst",
                        "business analytics",
                        "power bi",
                        "tableau"
                )
        ) {
            return "DATA_ANALYTICS";
        }

        // Cybersecurity
        if (
                containsAny(
                        normalizedTitle,
                        "cyber security",
                        "cybersecurity",
                        "cyber-security",
                        "information security",
                        "information-security",
                        "security analyst",
                        "security engineer"
                )
        ) {
            return "CYBERSECURITY";
        }

        // Cloud / DevOps
        if (
                containsAny(
                        normalizedTitle,
                        "devops",
                        "dev ops",
                        "cloud computing",
                        "cloud engineer",
                        "cloud intern",
                        "aws",
                        "azure",
                        "google cloud",
                        "docker",
                        "kubernetes"
                )
        ) {
            return "CLOUD_DEVOPS";
        }

        // Full Stack
        if (
                containsAny(
                        normalizedTitle,
                        "full stack",
                        "full-stack",
                        "fullstack"
                )
        ) {
            return "FULL_STACK_DEVELOPMENT";
        }

        // Frontend
        if (
                containsAny(
                        normalizedTitle,
                        "frontend",
                        "front-end",
                        "front end",
                        "react",
                        "react.js",
                        "reactjs",
                        "angular",
                        "vue.js",
                        "vuejs"
                )
        ) {
            return "FRONTEND_DEVELOPMENT";
        }

        // Backend
        if (
                containsAny(
                        normalizedTitle,
                        "backend",
                        "back-end",
                        "back end",
                        "rest api",
                        "restful api",
                        "spring boot",
                        "node.js",
                        "nodejs",
                        "express.js",
                        "expressjs",
                        "django",
                        "flask",
                        "fastapi"
                )
        ) {
            return "BACKEND_DEVELOPMENT";
        }

        // Web Development
        if (
                containsAny(
                        normalizedTitle,
                        "web development",
                        "web developer",
                        "website development",
                        "web application"
                )
        ) {
            return "WEB_DEVELOPMENT";
        }

        // Mobile
        if (
                containsAny(
                        normalizedTitle,
                        "android",
                        "android developer",
                        "android development",
                        "android intern",
                        "mobile app",
                        "mobile application",
                        "mobile app development",
                        "flutter",
                        "react native",
                        "unity",
                        "ar/vr"
                )
        ) {
            return "MOBILE_DEVELOPMENT";
        }

        // UI / UX
        if (
                containsAny(
                        normalizedTitle,
                        "ui/ux",
                        "ui ux",
                        "ui-ux",
                        "ux/ui",
                        "ux / ui",
                        "ui / ux",
                        "ux ui",
                        "ui and ux",
                        "ux and ui",
                        "ui & ux",
                        "ux & ui",
                        "user experience",
                        "user interface",
                        "product designer",
                        "product design",
                        "ux designer",
                        "ui designer",
                        "ux design",
                        "ui design"
                )
        ) {
            return "UI_UX";
        }

        // Testing / QA
        if (
                containsAny(
                        normalizedTitle,
                        "software testing",
                        "software tester",
                        "qa testing",
                        "qa engineer",
                        "qa intern",
                        "quality assurance",
                        "automation testing",
                        "test engineer",
                        "selenium"
                )
        ) {
            return "TESTING_QA";
        }

        // Database
        if (
                containsAny(
                        normalizedTitle,
                        "database",
                        "database engineer",
                        "database engineering",
                        "database developer",
                        "database intern",
                        "database administrator",
                        "database administration",
                        "sql developer",
                        "sql intern",
                        "mysql developer",
                        "postgresql",
                        "oracle database"
                )
        ) {
            return "DATABASE";
        }

        // Java
        if (
                containsAny(
                        normalizedTitle,
                        "java developer",
                        "java developer intern",
                        "java software",
                        "java intern",
                        "java programming",
                        "java spring",
                        "spring framework",
                        "spring boot developer"
                )
        ) {
            return "JAVA_DEVELOPMENT";
        }

        // Python
        if (
                containsAny(
                        normalizedTitle,
                        "python developer",
                        "python developer intern",
                        "python software",
                        "python intern",
                        "python programming",
                        "django",
                        "flask",
                        "fastapi"
                )
        ) {
            return "PYTHON_DEVELOPMENT";
        }

        // Fall back to description only when the title did not
        // contain a known CSE role signal.
        if (!normalizedDescription.isBlank()) {

            return detectCategoryFromDescription(
                    normalizedDescription
            );
        }

        return "GENERAL";
    }

    private String detectCategoryFromDescription(
            String text
    ) {

        if (
                containsAny(
                        text,
                        "generative ai",
                        "gen ai",
                        "large language model",
                        "large language models",
                        "llm",
                        "prompt engineering"
                )
        ) {
            return "GENERATIVE_AI";
        }

        if (
                containsAny(
                        text,
                        "machine learning",
                        "deep learning",
                        "artificial intelligence",
                        "ai/ml",
                        "ml engineer"
                )
        ) {
            return "AI_MACHINE_LEARNING";
        }

        if (
                containsAny(
                        text,
                        "data science",
                        "data scientist"
                )
        ) {
            return "DATA_SCIENCE";
        }

        if (
                containsAny(
                        text,
                        "data analyst",
                        "data analytics",
                        "data analysis",
                        "business analyst",
                        "business analytics",
                        "power bi",
                        "tableau"
                )
        ) {
            return "DATA_ANALYTICS";
        }

        if (
                containsAny(
                        text,
                        "cyber security",
                        "cybersecurity",
                        "information security",
                        "security analyst",
                        "security engineer"
                )
        ) {
            return "CYBERSECURITY";
        }

        if (
                containsAny(
                        text,
                        "devops",
                        "cloud computing",
                        "cloud engineer",
                        "aws",
                        "azure",
                        "google cloud",
                        "docker",
                        "kubernetes"
                )
        ) {
            return "CLOUD_DEVOPS";
        }

        if (
                containsAny(
                        text,
                        "full stack",
                        "full-stack",
                        "fullstack"
                )
        ) {
            return "FULL_STACK_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "frontend",
                        "front-end",
                        "react",
                        "angular",
                        "vue.js",
                        "vuejs"
                )
        ) {
            return "FRONTEND_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "backend",
                        "back-end",
                        "rest api",
                        "restful api",
                        "spring boot",
                        "node.js",
                        "nodejs"
                )
        ) {
            return "BACKEND_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "web development",
                        "web developer",
                        "website development",
                        "web application"
                )
        ) {
            return "WEB_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "android",
                        "mobile app",
                        "mobile application",
                        "flutter",
                        "react native",
                        "unity",
                        "ar/vr"
                )
        ) {
            return "MOBILE_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "ui/ux",
                        "ui ux",
                        "ui-ux",
                        "ux/ui",
                        "ux / ui",
                        "ui / ux",
                        "ux ui",
                        "ui and ux",
                        "ux and ui",
                        "ui & ux",
                        "ux & ui",
                        "user experience",
                        "user interface",
                        "product designer",
                        "product design",
                        "ux designer",
                        "ui designer",
                        "ux design",
                        "ui design"
                )
        ) {
            return "UI_UX";
        }

        if (
                containsAny(
                        text,
                        "software testing",
                        "software tester",
                        "qa testing",
                        "qa engineer",
                        "qa intern",
                        "quality assurance",
                        "automation testing",
                        "test engineer",
                        "selenium"
                )
        ) {
            return "TESTING_QA";
        }

        if (
                containsAny(
                        text,
                        "database",
                        "sql developer",
                        "sql intern",
                        "mysql",
                        "postgresql",
                        "oracle database"
                )
        ) {
            return "DATABASE";
        }

        if (
                containsAny(
                        text,
                        "java developer",
                        "java intern",
                        "java programming",
                        "spring boot developer"
                )
        ) {
            return "JAVA_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "python developer",
                        "python intern",
                        "python programming",
                        "django",
                        "flask",
                        "fastapi"
                )
        ) {
            return "PYTHON_DEVELOPMENT";
        }

        if (
                containsAny(
                        text,
                        "software developer",
                        "software development",
                        "software engineer",
                        "software engineering",
                        "developer intern"
                )
        ) {
            return "SOFTWARE_DEVELOPMENT";
        }

        return "GENERAL";
    }

    // ============================================================
    // YEAR ELIGIBILITY
    // ============================================================

    private String detectEligibleYears(
            String title,
            String description
    ) {

        String text =
                (
                        safe(title)
                                + " "
                                + safe(description)
                ).toLowerCase(
                        Locale.ROOT
                );

        boolean firstYear =
                containsAny(
                        text,
                        "1st year",
                        "first year",
                        "1st-year",
                        "first-year",
                        "freshman"
                );

        boolean secondYear =
                containsAny(
                        text,
                        "2nd year",
                        "second year",
                        "2nd-year",
                        "second-year",
                        "sophomore"
                );

        boolean thirdYear =
                containsAny(
                        text,
                        "3rd year",
                        "third year",
                        "3rd-year",
                        "third-year",
                        "pre-final year",
                        "pre final year",
                        "pre-final-year",
                        "penultimate year"
                );

        boolean fourthYear =
                containsAny(
                        text,
                        "4th year",
                        "fourth year",
                        "4th-year",
                        "fourth-year",
                        "final year",
                        "final-year",
                        "graduating year",
                        "graduating students",
                        "final year students"
                );

        boolean generalUndergraduate =
                containsAny(
                        text,
                        "any year",
                        "all years",
                        "all undergraduate students",
                        "undergraduate students from any year",
                        "students from any year",
                        "open to all students",
                        "open to undergraduate students"
                );

        if (generalUndergraduate) {
            return "GENERAL";
        }

        StringBuilder years =
                new StringBuilder();

        if (firstYear) {

            years.append(
                    "1ST_YEAR"
            );
        }

        if (secondYear) {

            appendYearSeparator(years);

            years.append(
                    "2ND_YEAR"
            );
        }

        if (thirdYear) {

            appendYearSeparator(years);

            years.append(
                    "3RD_YEAR"
            );
        }

        if (fourthYear) {

            appendYearSeparator(years);

            years.append(
                    "4TH_YEAR"
            );
        }

        if (years.isEmpty()) {
            return "GENERAL";
        }

        return years.toString();
    }

    private void appendYearSeparator(
            StringBuilder builder
    ) {

        if (!builder.isEmpty()) {
            builder.append(",");
        }
    }

    // ============================================================
    // KEYWORD MATCHING
    // ============================================================

    private boolean containsAny(
            String text,
            String... values
    ) {

        for (String value : values) {

            if (text.contains(value)) {
                return true;
            }
        }

        return false;
    }

    // ============================================================
    // EXPIRE STALE LISTINGS
    // ============================================================

    private void markStaleListingsExpired() {

        LocalDateTime cutoff =
                LocalDateTime.now()
                        .minusDays(3);

        List<ExternalInternship> stale =
                repository
                        .findByStatusAndLastSeenAtBefore(
                                "LIVE",
                                cutoff
                        );

        for (
                ExternalInternship internship :
                stale
        ) {

            internship.setStatus(
                    "EXPIRED"
            );

            internship.setUpdatedAt(
                    LocalDateTime.now()
            );

            repository.save(
                    internship
            );
        }

        LocalDate today =
                LocalDate.now();

        List<ExternalInternship> liveInternships =
                repository
                        .findByStatusOrderByLastVerifiedAtDesc(
                                "LIVE"
                        );

        for (
                ExternalInternship internship :
                liveInternships
        ) {

            LocalDate deadline =
                    internship.getApplicationDeadline();

            if (
                    deadline != null
                            && deadline.isBefore(today)
            ) {

                internship.setStatus(
                        "EXPIRED"
                );

                internship.setUpdatedAt(
                        LocalDateTime.now()
                );

                repository.save(
                        internship
                );
            }
        }
    }

    // ============================================================
    // PAY
    // ============================================================

    private String buildPayDisplay(
            JsonNode job
    ) {

        JsonNode salaryMin =
                job.get("salary_min");

        JsonNode salaryMax =
                job.get("salary_max");

        boolean hasMin =
                salaryMin != null
                        && salaryMin.isNumber();

        boolean hasMax =
                salaryMax != null
                        && salaryMax.isNumber();

        if (hasMin && hasMax) {

            return "Pay listed: ₹"
                    + formatNumber(
                    salaryMin.asDouble()
            )
                    + " - ₹"
                    + formatNumber(
                    salaryMax.asDouble()
            );
        }

        if (hasMin) {

            return "Pay listed: ₹"
                    + formatNumber(
                    salaryMin.asDouble()
            );
        }

        if (hasMax) {

            return "Pay listed: ₹"
                    + formatNumber(
                    salaryMax.asDouble()
            );
        }

        return "Pay not disclosed";
    }

    // ============================================================
    // DOMAIN
    // ============================================================

    private String detectDomain(
            String title,
            String description
    ) {

        String normalizedTitle =
                normalizeText(
                        title
                );

        String normalizedDescription =
                normalizeText(
                        description
                );

        /*
         * TITLE-FIRST domain detection.
         * Structural role signals are checked before language/framework
         * signals so that e.g. "Python Backend Developer" becomes
         * Backend, not Python.
         */

        if (
                containsAny(
                        normalizedTitle,
                        "generative ai",
                        "gen ai",
                        "large language model",
                        "large language models",
                        "llm",
                        "prompt engineering"
                )
        ) {
            return "Generative AI";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "machine learning",
                        "machine-learning",
                        "deep learning",
                        "deep-learning",
                        "ml engineer",
                        "ml intern"
                )
        ) {
            return "Machine Learning";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "artificial intelligence",
                        "ai engineer",
                        "ai intern",
                        "ai/ml",
                        "ai ml"
                )
        ) {
            return "Artificial Intelligence";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "data science",
                        "data scientist"
                )
        ) {
            return "Data Science";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "data analyst",
                        "data analytics",
                        "data analysis",
                        "power bi",
                        "tableau"
                )
        ) {
            return "Data Analytics";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "cyber security",
                        "cybersecurity",
                        "information security"
                )
        ) {
            return "Cyber Security";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "devops",
                        "dev ops",
                        "cloud computing",
                        "cloud engineer",
                        "cloud intern",
                        "aws",
                        "azure",
                        "google cloud",
                        "docker",
                        "kubernetes"
                )
        ) {
            return "DevOps";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "full stack",
                        "full-stack",
                        "fullstack"
                )
        ) {
            return "Full Stack";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "backend",
                        "back-end",
                        "back end",
                        "rest api",
                        "restful api",
                        "backend developer",
                        "backend engineer",
                        "python django",
                        "django developer",
                        "fastapi",
                        "flask"
                )
        ) {
            return "Backend";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "frontend",
                        "front-end",
                        "front end",
                        "react developer",
                        "angular developer",
                        "vue developer"
                )
        ) {
            return "Frontend";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "web development",
                        "web developer",
                        "website development",
                        "web application"
                )
        ) {
            return "Web Development";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "android",
                        "android developer",
                        "android development",
                        "mobile app",
                        "mobile application",
                        "mobile app development",
                        "flutter",
                        "react native",
                        "unity",
                        "ar/vr"
                )
        ) {
            return "Mobile Development";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "ui/ux",
                        "ui ux",
                        "ui-ux",
                        "ux/ui",
                        "ux / ui",
                        "ui / ux",
                        "ux ui",
                        "ui and ux",
                        "ux and ui",
                        "ui & ux",
                        "ux & ui",
                        "user experience",
                        "user interface",
                        "product designer",
                        "product design",
                        "ux designer",
                        "ui designer",
                        "ux design",
                        "ui design"
                )
        ) {
            return "UI/UX";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "software testing",
                        "software tester",
                        "qa testing",
                        "qa engineer",
                        "qa intern",
                        "quality assurance",
                        "automation testing",
                        "test engineer",
                        "selenium"
                )
        ) {
            return "Testing / QA";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "database",
                        "database engineer",
                        "database engineering",
                        "database developer",
                        "sql developer",
                        "sql intern",
                        "mysql developer",
                        "postgresql",
                        "oracle database"
                )
        ) {
            return "Database";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "java developer",
                        "java software",
                        "java intern",
                        "java programming",
                        "java spring",
                        "spring framework",
                        "spring boot developer"
                )
        ) {
            return "Java";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "python developer",
                        "python software",
                        "python intern",
                        "python programming",
                        "django",
                        "flask",
                        "fastapi"
                )
        ) {
            return "Python";
        }

        if (
                containsAny(
                        normalizedTitle,
                        "software developer",
                        "software development",
                        "software engineer",
                        "software engineering",
                        "sde intern",
                        "developer intern"
                )
        ) {
            return "Software Development";
        }

        /*
         * Description fallback only when the title is not specific
         * enough to determine a domain.
         */
        if (!normalizedDescription.isBlank()) {

            return detectDomainFromDescription(
                    normalizedDescription
            );
        }

        return "Software Development";
    }

    private String detectDomainFromDescription(
            String text
    ) {

        if (
                containsAny(
                        text,
                        "generative ai",
                        "gen ai",
                        "large language model",
                        "large language models",
                        "llm",
                        "prompt engineering"
                )
        ) {
            return "Generative AI";
        }

        if (
                containsAny(
                        text,
                        "machine learning",
                        "deep learning",
                        "ml engineer"
                )
        ) {
            return "Machine Learning";
        }

        if (
                containsAny(
                        text,
                        "artificial intelligence",
                        "ai engineer",
                        "ai/ml"
                )
        ) {
            return "Artificial Intelligence";
        }

        if (
                containsAny(
                        text,
                        "data science",
                        "data scientist"
                )
        ) {
            return "Data Science";
        }

        if (
                containsAny(
                        text,
                        "data analyst",
                        "data analytics",
                        "data analysis",
                        "power bi",
                        "tableau"
                )
        ) {
            return "Data Analytics";
        }

        if (
                containsAny(
                        text,
                        "cyber security",
                        "cybersecurity",
                        "information security"
                )
        ) {
            return "Cyber Security";
        }

        if (
                containsAny(
                        text,
                        "devops",
                        "cloud computing",
                        "aws",
                        "azure",
                        "google cloud",
                        "docker",
                        "kubernetes"
                )
        ) {
            return "DevOps";
        }

        if (
                containsAny(
                        text,
                        "full stack",
                        "full-stack",
                        "fullstack"
                )
        ) {
            return "Full Stack";
        }

        if (
                containsAny(
                        text,
                        "backend",
                        "back-end",
                        "rest api",
                        "spring boot",
                        "node.js",
                        "nodejs"
                )
        ) {
            return "Backend";
        }

        if (
                containsAny(
                        text,
                        "frontend",
                        "front-end",
                        "react",
                        "angular",
                        "vue.js",
                        "vuejs"
                )
        ) {
            return "Frontend";
        }

        if (
                containsAny(
                        text,
                        "web development",
                        "web developer",
                        "website development",
                        "web application"
                )
        ) {
            return "Web Development";
        }

        if (
                containsAny(
                        text,
                        "android",
                        "mobile app",
                        "mobile application",
                        "flutter",
                        "react native",
                        "unity",
                        "ar/vr"
                )
        ) {
            return "Mobile Development";
        }

        if (
                containsAny(
                        text,
                        "ui/ux",
                        "ui ux",
                        "ui-ux",
                        "ux/ui",
                        "ux / ui",
                        "ui / ux",
                        "ux ui",
                        "ui and ux",
                        "ux and ui",
                        "ui & ux",
                        "ux & ui",
                        "user experience",
                        "user interface",
                        "product designer",
                        "product design",
                        "ux designer",
                        "ui designer",
                        "ux design",
                        "ui design"
                )
        ) {
            return "UI/UX";
        }

        if (
                containsAny(
                        text,
                        "software testing",
                        "software tester",
                        "qa testing",
                        "qa engineer",
                        "qa intern",
                        "quality assurance",
                        "test engineer",
                        "selenium"
                )
        ) {
            return "Testing / QA";
        }

        if (
                containsAny(
                        text,
                        "database",
                        "sql",
                        "mysql",
                        "postgresql",
                        "oracle database"
                )
        ) {
            return "Database";
        }

        if (
                containsAny(
                        text,
                        "java developer",
                        "java intern",
                        "java programming",
                        "spring boot developer"
                )
        ) {
            return "Java";
        }

        if (
                containsAny(
                        text,
                        "python developer",
                        "python intern",
                        "python programming",
                        "django",
                        "flask",
                        "fastapi"
                )
        ) {
            return "Python";
        }

        if (
                containsAny(
                        text,
                        "software developer",
                        "software development",
                        "software engineer",
                        "software engineering",
                        "developer intern"
                )
        ) {
            return "Software Development";
        }

        return "Software Development";
    }

    // ============================================================
    // WORK MODE
    // ============================================================

    private String detectWorkMode(
            String title,
            String description,
            String location
    ) {

        String text =
                (
                        safe(title)
                                + " "
                                + safe(description)
                                + " "
                                + safe(location)
                ).toLowerCase(
                        Locale.ROOT
                );

        if (
                text.contains("remote")
                        || text.contains("work from home")
                        || text.contains("wfh")
        ) {
            return "Remote";
        }

        if (
                text.contains("hybrid")
        ) {
            return "Hybrid";
        }

        return "On-site";
    }

    // ============================================================
    // DURATION
    // ============================================================

    private String detectDuration(
            String description
    ) {

        String text =
                safe(description)
                        .toLowerCase(
                                Locale.ROOT
                        );

        Matcher matcher =
                DURATION_PATTERN.matcher(
                        text
                );

        if (matcher.find()) {

            return matcher.group(1)
                    + " "
                    + matcher.group(2);
        }

        return "Duration not disclosed";
    }

    // ============================================================
    // JSON FIELD
    // ============================================================

    private String text(
            JsonNode node,
            String field
    ) {

        if (
                node == null
                        || node.get(field) == null
                        || node.get(field).isNull()
        ) {
            return null;
        }

        return node
                .get(field)
                .asText();
    }

    private boolean isCseRelevantText(
            String title,
            String description
    ) {

        String normalizedTitle =
                normalizeText(
                        title
                );

        String normalizedDescription =
                normalizeText(
                        description
                );

        if (
                containsAny(
                        normalizedTitle,
                        "hr intern",
                        "human resources",
                        "recruitment intern",
                        "recruiter intern",
                        "talent acquisition",
                        "business development",
                        "sales intern",
                        "marketing intern",
                        "finance intern",
                        "accounting intern",
                        "legal intern",
                        "operations intern",
                        "customer support intern",
                        "customer service intern"
                )
        ) {
            return false;
        }

        return containsAny(
                normalizedTitle + " " + normalizedDescription,
                "software developer",
                "software engineer",
                "software development",
                "software engineering",
                "developer intern",
                "programming",
                "java",
                "python",
                "javascript",
                "typescript",
                "react",
                "angular",
                "vue",
                "full stack",
                "frontend",
                "backend",
                "web developer",
                "web development",
                "data science",
                "data scientist",
                "data analyst",
                "data analytics",
                "machine learning",
                "artificial intelligence",
                "generative ai",
                "large language model",
                "llm",
                "cloud",
                "aws",
                "azure",
                "devops",
                "cybersecurity",
                "software testing",
                "qa testing",
                "quality assurance",
                "database",
                "sql",
                "mysql",
                "postgresql",
                "android",
                "mobile app",
                "flutter",
                "react native",
                "ui/ux",
                "ui ux",
                "ui-ux",
                "ux/ui",
                "user experience",
                "user interface",
                "product designer",
                "product design",
                "ux designer",
                "ui designer",
                "unity",
                "ar/vr"
        );
    }

    // ============================================================
    // TEXT NORMALIZATION
    // ============================================================

    private String normalizeText(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .toLowerCase(Locale.ROOT)
                .replace("&", " and ")
                .replace("/", " / ")
                .replace("-", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // ============================================================
    // SAFE STRING
    // ============================================================

    private String safe(
            String value
    ) {

        return value == null
                ? ""
                : value;
    }

    // ============================================================
    // TRUNCATE
    // ============================================================

    private String truncate(
            String value,
            int maxLength
    ) {

        if (value == null) {
            return "";
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(
                0,
                maxLength
        );
    }

    // ============================================================
    // NUMBER FORMAT
    // ============================================================

    private String formatNumber(
            double value
    ) {

        if (
                value == Math.floor(value)
        ) {

            return String.format(
                    Locale.US,
                    "%.0f",
                    value
            );
        }

        return String.format(
                Locale.US,
                "%.2f",
                value
        );
    }

    // ============================================================
    // CONFIGURATION
    // ============================================================

    private boolean isConfigured() {

        return enabled
                && appId != null
                && !appId.isBlank()
                && appKey != null
                && !appKey.isBlank();
    }
}