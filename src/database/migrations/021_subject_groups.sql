-- Useful for higher secondary or electives.
CREATE TABLE
    IF NOT EXISTS subject_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_subject_group (school_id, name),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );