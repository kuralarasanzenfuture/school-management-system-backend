-- CREATE TABLE
--     IF NOT EXISTS academic_years (
--         id INT AUTO_INCREMENT PRIMARY KEY,
--         school_id INT NOT NULL,
--         name VARCHAR(20) NOT NULL, -- e.g. 2025-2026
--         start_date DATE NOT NULL,
--         end_date DATE NOT NULL,
--         is_current BOOLEAN DEFAULT FALSE,
--         status ENUM ('active', 'inactive') DEFAULT 'active',
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         UNIQUE KEY uq_year (school_id, name),
--         FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
--     );
CREATE TABLE
    IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(20) NOT NULL, -- 2025-2026
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN DEFAULT FALSE,
        status ENUM ('active', 'inactive', 'archived') DEFAULT 'active',
        created_by INT NULL,
        updated_by INT NULL,
        remarks VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_dates CHECK (start_date < end_date),
        UNIQUE KEY uq_school_year (school_id, name),
        INDEX idx_school (school_id),
        INDEX idx_current (school_id, is_current),
        INDEX idx_status (school_id, status),
        INDEX idx_dates (start_date, end_date),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
    );