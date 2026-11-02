package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
}