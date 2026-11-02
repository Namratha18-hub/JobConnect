package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeRepository
        extends JpaRepository<Resume, Long> {

    List<Resume> findByStudent_UserId(Long userId);
}