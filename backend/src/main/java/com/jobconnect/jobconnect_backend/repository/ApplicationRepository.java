package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.Application;
import com.jobconnect.jobconnect_backend.entity.Resume;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    boolean existsByStudentUserIdAndJobId(
            Long studentId,
            Long jobId
    );

    @Query("""
           SELECT DISTINCT a.resume
           FROM Application a
           WHERE a.job.postedBy.userId = :recruiterUserId
           """)
    List<Resume> findDistinctResumesForRecruiter(
            @Param("recruiterUserId") Long recruiterUserId
    );

    boolean existsByResume_IdAndJob_PostedBy_UserId(
            Long resumeId,
            Long recruiterUserId
    );

    // Admin: fetch application details with related entities.
    @EntityGraph(attributePaths = {
            "student",
            "student.user",
            "job",
            "job.company",
            "resume"
    })
    List<Application> findAllByOrderByAppliedAtDesc();
}