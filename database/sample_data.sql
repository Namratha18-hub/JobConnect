-- =====================================================================
-- JobConnect — Sample Data
-- Run AFTER schema.sql, against jobconnect_db
-- Note: password values below are placeholder BCrypt-shaped strings —
-- Phase 4 will generate real BCrypt hashes via Spring Security.
-- =====================================================================

USE jobconnect_db;

-- ---------- USERS ----------
INSERT INTO users (id, name, email, password, role, account_status) VALUES
(1, 'Ananya Rao',       'ananya.rao@example.com',   '$2a$10$placeholderHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'STUDENT',   'ACTIVE'),
(2, 'Vikram Sharma',    'vikram.sharma@example.com','$2a$10$placeholderHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'STUDENT',   'ACTIVE'),
(3, 'Priya Nair',       'priya.nair@techcorp.com',  '$2a$10$placeholderHashCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'RECRUITER', 'ACTIVE'),
(4, 'Rahul Mehta',      'rahul.mehta@innovate.com', '$2a$10$placeholderHashDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'RECRUITER', 'ACTIVE'),
(5, 'Admin User',       'admin@jobconnect.com',     '$2a$10$placeholderHashEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'ADMIN',     'ACTIVE');

-- ---------- COMPANIES ----------
INSERT INTO companies (id, name, description, website, location, industry, logo_url) VALUES
(1, 'TechCorp Solutions', 'A mid-size product company building B2B SaaS tools.', 'https://techcorp.example.com', 'Hyderabad, India', 'Information Technology', NULL),
(2, 'Innovate Labs',      'An early-stage startup working on developer tooling.', 'https://innovatelabs.example.com', 'Bengaluru, India', 'Software', NULL);

-- ---------- STUDENT PROFILES ----------
INSERT INTO student_profiles (user_id, phone, location, about, profile_photo_url) VALUES
(1, '9000000001', 'Vijayawada, India', 'Final-year CSE student interested in backend development.', NULL),
(2, '9000000002', 'Chennai, India',    'CSE student exploring full-stack development.', NULL);

-- ---------- RECRUITER PROFILES ----------
INSERT INTO recruiter_profiles (user_id, company_id, designation, phone) VALUES
(3, 1, 'HR Manager',        '9111111111'),
(4, 2, 'Talent Acquisition','9222222222');

-- ---------- SKILLS ----------
INSERT INTO skills (id, name) VALUES
(1, 'Java'), (2, 'Spring Boot'), (3, 'MySQL'), (4, 'React'),
(5, 'Git'), (6, 'JavaScript'), (7, 'TypeScript'), (8, 'REST APIs'),
(9, 'Hibernate'), (10, 'Docker');

-- ---------- STUDENT_SKILLS ----------
INSERT INTO student_skills (student_id, skill_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5),                 -- Ananya: Java, Spring Boot, MySQL, Git
(2, 1), (2, 4), (2, 6), (2, 5);                 -- Vikram: Java, React, JavaScript, Git

-- ---------- EDUCATION ----------
INSERT INTO education (student_id, degree, institution, field_of_study, start_date, end_date, grade) VALUES
(1, 'B.Tech', 'JNTU Kakinada', 'Computer Science and Engineering', '2022-08-01', '2026-05-31', '8.7 CGPA'),
(2, 'B.Tech', 'Anna University', 'Computer Science and Engineering', '2022-08-01', '2026-05-31', '8.2 CGPA');

-- ---------- EXPERIENCE ----------
INSERT INTO experience (student_id, company_name, role_title, description, start_date, end_date) VALUES
(1, 'CodeCraft Pvt Ltd', 'Backend Intern', 'Built REST APIs using Spring Boot for an internal tool.', '2025-05-01', '2025-07-31');

-- ---------- RESUMES (one active per student) ----------
INSERT INTO resumes (id, student_id, file_name, file_path, file_size, is_active) VALUES
(1, 1, 'ananya_rao_resume_v1.pdf', '/uploads/resumes/1/ananya_rao_resume_v1.pdf', 245000, FALSE),
(2, 1, 'ananya_rao_resume_v2.pdf', '/uploads/resumes/1/ananya_rao_resume_v2.pdf', 251000, TRUE),
(3, 2, 'vikram_sharma_resume.pdf', '/uploads/resumes/2/vikram_sharma_resume.pdf', 198000, TRUE);

-- ---------- JOBS ----------
INSERT INTO jobs (id, company_id, posted_by, title, description, requirements, responsibilities,
                   location, work_mode, employment_type, job_type, salary_min, salary_max, stipend,
                   experience_required, application_deadline, status) VALUES
(1, 1, 3, 'Java Backend Developer',
   'We are looking for a Java backend developer to join our platform team.',
   'Strong understanding of Java, Spring Boot, and relational databases.',
   'Design and implement REST APIs; write unit tests; participate in code reviews.',
   'Hyderabad, India', 'HYBRID', 'FULL_TIME', 'JOB', 600000, 900000, NULL,
   '0-2 years', '2026-10-15', 'PUBLISHED'),
(2, 1, 3, 'Backend Development Intern',
   'A 6-month internship focused on backend feature development.',
   'Familiarity with Java and basic web concepts.',
   'Assist in building and testing backend features under mentor guidance.',
   'Hyderabad, India', 'REMOTE', 'INTERNSHIP', 'INTERNSHIP', NULL, NULL, 20000,
   '0 years', '2026-09-30', 'PUBLISHED'),
(3, 2, 4, 'Frontend Developer (React)',
   'Join our small team building developer-facing dashboards in React.',
   'Solid React and JavaScript/TypeScript fundamentals.',
   'Build reusable UI components and integrate with REST APIs.',
   'Bengaluru, India', 'ONSITE', 'FULL_TIME', 'JOB', 500000, 800000, NULL,
   '0-1 years', '2026-11-01', 'PUBLISHED');

-- ---------- JOB_SKILLS ----------
INSERT INTO job_skills (job_id, skill_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 8),      -- Java, Spring Boot, MySQL, REST APIs
(2, 1), (2, 2),                      -- Java, Spring Boot
(3, 4), (3, 6), (3, 7);              -- React, JavaScript, TypeScript

-- ---------- APPLICATIONS (unique per student+job) ----------
INSERT INTO applications (id, student_id, job_id, resume_id, cover_letter, status) VALUES
(1, 1, 1, 2, 'I am excited to apply for the Java Backend Developer role...', 'SHORTLISTED'),
(2, 1, 2, 2, 'I would love to intern with your backend team...', 'APPLIED'),
(3, 2, 3, 3, 'I have been building React projects for the past year...', 'UNDER_REVIEW');

-- ---------- SAVED_JOBS (unique per student+job) ----------
INSERT INTO saved_jobs (student_id, job_id) VALUES
(2, 1);  -- Vikram saved the Java Backend Developer job for later

-- ---------- NOTIFICATIONS ----------
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(1, 'Application Submitted', 'Your application for Java Backend Developer was submitted successfully.', TRUE),
(1, 'Shortlisted', 'You have been shortlisted for Java Backend Developer.', FALSE),
(2, 'Application Submitted', 'Your application for Frontend Developer (React) was submitted successfully.', FALSE);

-- ---------- INTERVIEWS (multiple allowed per application) ----------
INSERT INTO interviews (application_id, scheduled_date, scheduled_time, interview_type,
                         meeting_link, interviewer_name, notes, status) VALUES
(1, '2026-09-20', '11:00:00', 'ONLINE', 'https://meet.example.com/abc-defg-hij', 'Priya Nair',
   'Technical round 1 — data structures and Spring Boot basics.', 'SCHEDULED');

-- ---------- ADMIN_ACTIONS ----------
INSERT INTO admin_actions (admin_id, action_type, target_table, target_id, description) VALUES
(5, 'REVIEW_JOB', 'jobs', 1, 'Reviewed job posting for policy compliance — no action needed.');