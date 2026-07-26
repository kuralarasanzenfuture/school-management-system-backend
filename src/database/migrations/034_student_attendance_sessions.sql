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
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        class_section_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        attendance_type ENUM ('daily', 'period') DEFAULT 'daily',
        period_no TINYINT UNSIGNED NULL,
        taken_by BIGINT NOT NULL,
        is_locked BOOLEAN DEFAULT FALSE,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- One attendance session only
        UNIQUE KEY uq_session (
            school_id,
            academic_year_id,
            class_section_id,
            attendance_date,
            attendance_type,
            period_no
        ),
        -- Reports by class/date
        INDEX idx_class_date (class_section_id, attendance_date),
        -- Teacher dashboard
        INDEX idx_teacher_date (taken_by, attendance_date),
        -- Monthly reports
        INDEX idx_school_date (school_id, attendance_date),
        -- Academic year reports
        INDEX idx_year_class (academic_year_id, class_section_id),
        -- Lock/Unlock
        INDEX idx_locked (is_locked),
        FOREIGN KEY (school_id) REFERENCES schools (id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id),
        FOREIGN KEY (class_section_id) REFERENCES class_sections (id),
        FOREIGN KEY (taken_by) REFERENCES employees (id)
    );