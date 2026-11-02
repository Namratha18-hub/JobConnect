package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.external.ExternalInternship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExternalInternshipRepository
        extends JpaRepository<ExternalInternship, Long> {

    Optional<ExternalInternship> findBySourceAndExternalId(
            String source,
            String externalId
    );

    List<ExternalInternship> findByStatusOrderByLastVerifiedAtDesc(
            String status
    );

    List<ExternalInternship> findByStatusAndLastSeenAtBefore(
            String status,
            LocalDateTime time
    );
}