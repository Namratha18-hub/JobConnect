USE jobconnect_db;

CREATE TABLE IF NOT EXISTS external_internships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    source VARCHAR(50) NOT NULL,
    external_id VARCHAR(120) NOT NULL,

    title VARCHAR(180) NOT NULL,
    company_name VARCHAR(180) NOT NULL,

    description TEXT,
    location VARCHAR(160),
    work_mode VARCHAR(30),

    duration VARCHAR(100),
    pay_display VARCHAR(120),

    application_deadline DATE NULL,

    domain VARCHAR(80) NOT NULL,

    external_apply_url VARCHAR(1000) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'LIVE',

    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_external_internship_source_id
        UNIQUE (source, external_id),

    INDEX idx_external_internship_status
        (status),

    INDEX idx_external_internship_deadline
        (application_deadline),

    INDEX idx_external_internship_last_seen
        (last_seen_at)
) ENGINE=InnoDB;