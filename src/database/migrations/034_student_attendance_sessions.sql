-- CREATE TABLE
--     IF NOT EXISTS student_attendance_sessions (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         school_id INT NOT NULL,
--         academic_year_id INT NOT NULL,
--         class_section_id INT NOT NULL,
--         attendance_date DATE NOT NULL,
--         attendance_type ENUM ('daily', 'period') DEFAULT 'daily',
--         period_no TINYINT NULL,
--         taken_by BIGINT NOT NULL,
--         is_locked BOOLEAN DEFAULT FALSE,
--         remarks TEXT,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         UNIQUE KEY uq_session (
--             school_id,
--             academic_year_id,
--             class_section_id,
--             attendance_date,
--             period_no
--         ),
--         FOREIGN KEY (school_id) REFERENCES schools (id),
--         FOREIGN KEY (academic_year_id) REFERENCES academic_years (id),
--         FOREIGN KEY (class_section_id) REFERENCES class_sections (id),
--         FOREIGN KEY (taken_by) REFERENCES employees (id)
--     );
CREATE TABLE
    IF NOT EXISTS student_attendance_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        -- Organization
        school_id BIGINT UNSIGNED NOT NULL,
        academic_year_id BIGINT UNSIGNED NOT NULL,
        class_section_id BIGINT UNSIGNED NOT NULL,
        -- Attendance details
        attendance_date DATE NOT NULL,
        attendance_type ENUM ('daily', 'period') NOT NULL DEFAULT 'daily',
        -- 0 = daily attendance; 1, 2, 3... = period attendance
        period_no TINYINT UNSIGNED NOT NULL DEFAULT 0,
        -- Audit fields: login users
        created_by BIGINT UNSIGNED NULL,
        updated_by BIGINT UNSIGNED NULL,
        -- Session control
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        remarks TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- Prevent duplicate attendance sessions
        CONSTRAINT uq_attendance_session UNIQUE (
            school_id,
            academic_year_id,
            class_section_id,
            attendance_date,
            attendance_type,
            period_no
        ),
        -- Reports
        INDEX idx_session_class_date (class_section_id, attendance_date),
        INDEX idx_session_created_by_date (created_by, attendance_date),
        INDEX idx_session_school_date (school_id, attendance_date),
        INDEX idx_session_year_class (academic_year_id, class_section_id),
        -- Useful when retrieving locked/unlocked sessions
        INDEX idx_session_locked_date (school_id, is_locked, attendance_date),
        -- Enforce valid daily/period combinations (MySQL 8.0.16+)
        CONSTRAINT chk_attendance_period CHECK (
            (
                attendance_type = 'daily'
                AND period_no = 0
            )
            OR (
                attendance_type = 'period'
                AND period_no > 0
            )
        ),
        CONSTRAINT fk_session_school FOREIGN KEY (school_id) REFERENCES schools (id),
        CONSTRAINT fk_session_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years (id),
        CONSTRAINT fk_session_class_section FOREIGN KEY (class_section_id) REFERENCES class_sections (id),
        CONSTRAINT fk_session_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_session_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
    );