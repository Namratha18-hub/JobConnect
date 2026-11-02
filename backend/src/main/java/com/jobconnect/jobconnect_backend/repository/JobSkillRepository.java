package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobSkillRepository extends JpaRepository<JobSkill, JobSkill.JobSkillId> {
}