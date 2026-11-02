package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {
}