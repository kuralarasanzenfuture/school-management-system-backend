-- Maps classes to subjects.
-- CREATE TABLE
--     IF NOT EXISTS class_subjects (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         school_id INT NOT NULL,
--         class_id INT NOT NULL,
--         subject_id INT NOT NULL,
--         subject_group_id INT NULL,
--         employee_id BIGINT NULL,
--         academic_year_id INT NOT NULL,
--         is_optional BOOLEAN DEFAULT FALSE,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         UNIQUE KEY uq_class_subject (class_id, subject_id, academic_year_id),
--         FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
--         FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
--         FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
--         FOREIGN KEY (subject_group_id) REFERENCES subject_groups (id) ON DELETE SET NULL,
--         FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL,
--         FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE CASCADE
--     );
CREATE TABLE
    IF NOT EXISTS class_subjects (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        class_section_id INT NOT NULL,
        subject_id INT NOT NULL,
        subject_group_id INT NULL,
        employee_id BIGINT NULL,
        is_optional BOOLEAN DEFAULT FALSE,
        weekly_periods INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_class_subject (class_section_id, subject_id),
        FOREIGN KEY (class_section_id) REFERENCES class_sections (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_group_id) REFERENCES subject_groups (id) ON DELETE SET NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL
    );