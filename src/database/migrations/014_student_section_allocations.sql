CREATE TABLE
    IF NOT EXISTS student_section_allocations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        admission_id BIGINT UNSIGNED NOT NULL,
        class_section_id BIGINT UNSIGNED NOT NULL,
        roll_no VARCHAR(20) NULL,
        allocation_date DATE NOT NULL,
        effective_to DATE NULL,
        status ENUM ('active', 'transferred', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
        remarks VARCHAR(255) NULL,
        created_by BIGINT UNSIGNED NULL,
        updated_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_section_allocation_admission (admission_id),
        INDEX idx_section_allocation_class (class_section_id),
        CONSTRAINT fk_section_allocation_admission FOREIGN KEY (admission_id) REFERENCES student_admissions (id) ON DELETE RESTRICT,
        CONSTRAINT fk_section_allocation_class_section FOREIGN KEY (class_section_id) REFERENCES class_sections (id) ON DELETE RESTRICT,
        CONSTRAINT chk_section_allocation_dates CHECK (
            effective_to IS NULL
            OR effective_to >= allocation_date
        )
        UNIQUE KEY unique_section_allocation (admission_id, class_section_id, allocation_date),
    );
