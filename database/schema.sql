-- =====================================================================
-- JobConnect — Job & Internship Portal
-- Database: jobconnect_db
-- Engine: MySQL 8+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS jobconnect_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE jobconnect_db;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. USERS  — one row per login-capable account, any role
-- =====================================================================
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(120)        NOT NULL,
    email           VARCHAR(160)        NOT NULL,
    password        VARCHAR(255)        NOT NULL,          -- BCrypt hash, never plain text
    role            ENUM('STUDENT', 'RECRUITER', 'ADMIN') NOT NULL,
    account_status  ENUM('ACTIVE', 'DISABLED', 'PENDING')  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. COMPANIES — created independently, then linked to recruiters
-- =====================================================================
CREATE TABLE companies (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(160)    NOT NULL,
    description     TEXT,
    website         VARCHAR(255),
    location        VARCHAR(160),
    industry        VARCHAR(120),
    logo_url        VARCHAR(255),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_companies_name UNIQUE (name)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. STUDENT_PROFILES — 1:1 extension of users where role = STUDENT
--    PK = FK to users.id (identifying relationship, no separate surrogate key)
-- =====================================================================
CREATE TABLE student_profiles (
    user_id         BIGINT          PRIMARY KEY,
    phone           VARCHAR(20),
    location        VARCHAR(160),
    about           TEXT,
    profile_photo_url VARCHAR(255),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. RECRUITER_PROFILES — 1:1 extension of users where role = RECRUITER
--    Each recruiter belongs to exactly one company.
-- =====================================================================
CREATE TABLE recruiter_profiles (
    user_id         BIGINT          PRIMARY KEY,
    company_id      BIGINT          NOT NULL,
    designation     VARCHAR(120),
    phone           VARCHAR(20),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recruiter_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_recruiter_profiles_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 5. SKILLS — master lookup list (Java, Spring Boot, React, ...)
-- =====================================================================
CREATE TABLE skills (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    CONSTRAINT uq_skills_name UNIQUE (name)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. STUDENT_SKILLS — join table (many-to-many: student <-> skill)
--    Pure ownership data: cascades with the student profile.
-- =====================================================================
CREATE TABLE student_skills (
    student_id      BIGINT          NOT NULL,
    skill_id        BIGINT          NOT NULL,
    PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_student_skills_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_student_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 7. EDUCATION — 1:N with student_profiles
-- =====================================================================
CREATE TABLE education (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    degree          VARCHAR(150)    NOT NULL,
    institution     VARCHAR(200)    NOT NULL,
    field_of_study  VARCHAR(150),
    start_date      DATE            NOT NULL,
    end_date        DATE,
    grade           VARCHAR(20),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_education_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_education_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. EXPERIENCE — 1:N with student_profiles
-- =====================================================================
CREATE TABLE experience (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    company_name    VARCHAR(200)    NOT NULL,
    role_title      VARCHAR(150)    NOT NULL,
    description     TEXT,
    start_date      DATE            NOT NULL,
    end_date        DATE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_experience_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_experience_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. RESUMES — 1:N with student_profiles, exactly one active at a time
--    (the "exactly one active" rule is enforced in the SERVICE layer,
--     not the database — see notes below the schema)
-- =====================================================================
CREATE TABLE resumes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    file_name       VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    file_size       BIGINT          NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT FALSE,
    uploaded_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumes_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 10. JOBS — posted by a recruiter, owned by a company
-- =====================================================================
CREATE TABLE jobs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id          BIGINT          NOT NULL,
    posted_by           BIGINT          NOT NULL,      -- FK -> recruiter_profiles.user_id
    title               VARCHAR(180)    NOT NULL,
    description         TEXT            NOT NULL,
    requirements        TEXT,
    responsibilities    TEXT,
    location            VARCHAR(160)    NOT NULL,
    work_mode           ENUM('REMOTE', 'HYBRID', 'ONSITE')          NOT NULL,
    employment_type     ENUM('FULL_TIME', 'PART_TIME', 'INTERNSHIP') NOT NULL,
    job_type            ENUM('JOB', 'INTERNSHIP')                   NOT NULL,
    salary_min          DECIMAL(12,2),
    salary_max          DECIMAL(12,2),
    stipend             DECIMAL(12,2),
    experience_required VARCHAR(50),                    -- e.g. "0-1 years", "2+ years"
    application_deadline DATE           NOT NULL,
    status              ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_jobs_recruiter
        FOREIGN KEY (posted_by) REFERENCES recruiter_profiles(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_jobs_salary CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
) ENGINE=InnoDB;

-- =====================================================================
-- 11. JOB_SKILLS — join table (many-to-many: job <-> skill)
-- =====================================================================
CREATE TABLE job_skills (
    job_id          BIGINT          NOT NULL,
    skill_id        BIGINT          NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_job_skills_job
        FOREIGN KEY (job_id) REFERENCES jobs(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_job_skills_skill
        FOREIGN KEY (skill_id) REFERENCES skills(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 12. APPLICATIONS — student applies to a job with one resume snapshot
--     uq_applications_student_job PREVENTS DUPLICATE APPLICATIONS
-- =====================================================================
CREATE TABLE applications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT          NOT NULL,
    job_id          BIGINT          NOT NULL,
    resume_id       BIGINT          NOT NULL,
    cover_letter    TEXT,
    status          ENUM('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW',
                         'SELECTED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'APPLIED',
    applied_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_applications_student_job UNIQUE (student_id, job_id),
    CONSTRAINT fk_applications_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id) REFERENCES jobs(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_applications_resume
        FOREIGN KEY (resume_id) REFERENCES resumes(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 13. SAVED_JOBS — join table (many-to-many: student <-> job)
--     Composite PK PREVENTS DUPLICATE SAVES
-- =====================================================================
CREATE TABLE saved_jobs (
    student_id      BIGINT          NOT NULL,
    job_id          BIGINT          NOT NULL,
    saved_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, job_id),
    CONSTRAINT fk_saved_jobs_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saved_jobs_job
        FOREIGN KEY (job_id) REFERENCES jobs(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 14. NOTIFICATIONS — belongs to any user (student, recruiter, or admin)
-- =====================================================================
CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    title           VARCHAR(160)    NOT NULL,
    message         VARCHAR(500)    NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 15. INTERVIEWS — 1:N with applications (an application MAY have
--     several interview rounds — no unique constraint on application_id)
-- =====================================================================
CREATE TABLE interviews (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id  BIGINT          NOT NULL,
    scheduled_date  DATE            NOT NULL,
    scheduled_time  TIME            NOT NULL,
    interview_type  ENUM('ONLINE', 'OFFLINE') NOT NULL,
    meeting_link    VARCHAR(255),
    interviewer_name VARCHAR(120),
    notes           TEXT,
    status          ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_application
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 16. ADMIN_ACTIONS — audit trail of moderation actions
-- =====================================================================
CREATE TABLE admin_actions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id        BIGINT          NOT NULL,
    action_type     VARCHAR(80)     NOT NULL,   -- e.g. 'DISABLE_USER', 'REMOVE_JOB'
    target_table    VARCHAR(60)     NOT NULL,   -- e.g. 'users', 'jobs'
    target_id       BIGINT          NOT NULL,
    description     VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_actions_admin
        FOREIGN KEY (admin_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- INDEXING STRATEGY
-- (email/name already unique-indexed above; these cover query patterns)
-- =====================================================================

-- Job search & filtering (Phase 8) — the highest-traffic read path
CREATE INDEX idx_jobs_status_deadline ON jobs (status, application_deadline);
CREATE INDEX idx_jobs_location        ON jobs (location);
CREATE INDEX idx_jobs_job_type        ON jobs (job_type);
CREATE INDEX idx_jobs_work_mode       ON jobs (work_mode);
CREATE INDEX idx_jobs_employment_type ON jobs (employment_type);
CREATE INDEX idx_jobs_company         ON jobs (company_id);
CREATE FULLTEXT INDEX ftx_jobs_title_description ON jobs (title, description);

-- Applications: recruiter viewing applicants for a job; student viewing own history
CREATE INDEX idx_applications_job_status ON applications (job_id, status);
CREATE INDEX idx_applications_student    ON applications (student_id, applied_at);

-- Interviews: student's upcoming interviews, recruiter's schedule
CREATE INDEX idx_interviews_application ON interviews (application_id);
CREATE INDEX idx_interviews_date_status ON interviews (scheduled_date, status);

-- Notifications: fetch unread for a user, most recent first
CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read, created_at);

-- Resumes: fetch a student's active resume quickly
CREATE INDEX idx_resumes_student_active ON resumes (student_id, is_active);

-- Recruiter profiles by company (recruiter management, admin views)
CREATE INDEX idx_recruiter_profiles_company ON recruiter_profiles (company_id);

-- Admin audit lookups by target
CREATE INDEX idx_admin_actions_target ON admin_actions (target_table, target_id);