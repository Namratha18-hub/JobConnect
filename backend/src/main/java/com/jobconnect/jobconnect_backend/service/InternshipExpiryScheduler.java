package com.jobconnect.jobconnect_backend.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;

@Service
public class InternshipExpiryScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(
                    InternshipExpiryScheduler.class
            );

    @PersistenceContext
    private EntityManager entityManager;

    /*
     * Runs:
     * - 10 seconds after backend startup
     * - then once every 24 hours
     *
     * This checks all published internships and closes
     * those whose application deadline has already passed.
     */
    @Scheduled(
            initialDelayString = "10000",
            fixedDelayString = "86400000"
    )
    @Transactional
    public void expireInternships() {

        LocalDate today = LocalDate.now();

        int updatedCount =
                entityManager
                        .createNativeQuery(
                                """
                                UPDATE jobs
                                SET status = 'CLOSED',
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE status = 'PUBLISHED'
                                  AND job_type = 'INTERNSHIP'
                                  AND application_deadline < :today
                                """
                        )
                        .setParameter(
                                "today",
                                Date.valueOf(today)
                        )
                        .executeUpdate();

        if (updatedCount > 0) {

            log.info(
                    "Internship expiry scheduler closed {} expired internship(s) on {}.",
                    updatedCount,
                    today
            );

        } else {

            log.info(
                    "Internship expiry scheduler checked {}. No expired internships found.",
                    today
            );
        }
    }
}