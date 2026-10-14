CREATE TABLE
    IF NOT EXISTS employee_designations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        school_id BIGINT UNSIGNED NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_by BIGINT UNSIGNED NULL,
        updated_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE KEY uq_designation_school (school_id, name)
    );