CREATE TABLE IF NOT EXISTS academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,

    name VARCHAR(20) NOT NULL, -- e.g. 2025-2026
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_current BOOLEAN DEFAULT FALSE,
    status ENUM('active','inactive') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_year (school_id, name),

    FOREIGN KEY (school_id)
    REFERENCES schools(id)
    ON DELETE CASCADE
);