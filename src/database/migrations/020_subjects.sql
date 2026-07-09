CREATE TABLE
    IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) ,
        subject_type ENUM ('theory', 'practical', 'both') DEFAULT 'theory',
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_subject (school_id, name),
        UNIQUE KEY uq_subject_code (school_id, code),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );