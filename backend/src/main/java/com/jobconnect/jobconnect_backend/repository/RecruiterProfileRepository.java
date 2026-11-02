package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.RecruiterProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterProfileRepository extends JpaRepository<RecruiterProfile, Long> {
}