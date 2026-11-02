package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedJobRepository extends JpaRepository<SavedJob, SavedJob.SavedJobId> {

    boolean existsByStudentUserIdAndJobId(Long studentId, Long jobId);
}