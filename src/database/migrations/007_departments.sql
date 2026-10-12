CREATE TABLE
    IF NOT EXISTS departments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        school_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_by BIGINT UNSIGNED,
        updated_by BIGINT UNSIGNED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
        UNIQUE KEY uq_department (school_id, name),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );