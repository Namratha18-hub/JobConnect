package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
}