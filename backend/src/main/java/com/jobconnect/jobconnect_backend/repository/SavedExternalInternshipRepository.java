package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.SavedExternalInternship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedExternalInternshipRepository
        extends JpaRepository<
                SavedExternalInternship,
                SavedExternalInternship.SavedExternalInternshipId> {

    List<SavedExternalInternship> findByStudent_UserId(
            Long userId
    );
}