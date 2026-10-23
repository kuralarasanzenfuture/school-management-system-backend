-- CREATE TABLE
--     IF NOT EXISTS student_attendance (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         attendance_session_id BIGINT NOT NULL,
--         admission_id BIGINT NOT NULL,
--         student_id BIGINT NOT NULL,
--         attendance_status ENUM ('present', 'absent', 'late', 'half_day', 'leave') NOT NULL,
--         in_time TIME NULL,
--         out_time TIME NULL,
--         remarks VARCHAR(255),
--         marked_by BIGINT NOT NULL,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         UNIQUE KEY uq_student_attendance (attendance_session_id, student_id),
--         FOREIGN KEY (attendance_session_id) REFERENCES student_attendance_sessions (id) ON DELETE CASCADE,
--         FOREIGN KEY (admission_id) REFERENCES student_admissions (id) ON DELETE CASCADE,
--         FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
--         FOREIGN KEY (marked_by) REFERENCES employees (id)
--     );
CREATE TABLE
    IF NOT EXISTS student_attendance (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        attendance_session_id BIGINT UNSIGNED NOT NULL,
        admission_id BIGINT UNSIGNED NOT NULL,
        student_id BIGINT UNSIGNED NOT NULL,
        attendance_status ENUM ('present', 'absent', 'late', 'half_day', 'leave') NOT NULL DEFAULT 'present',
        remarks VARCHAR(255) NULL,
        created_by BIGINT UNSIGNED NULL,
        updated_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- One attendance record per admission per session
        CONSTRAINT uq_student_attendance UNIQUE (attendance_session_id, admission_id),
        INDEX idx_attendance_admission (admission_id),
        INDEX idx_attendance_created_by (created_by),
        INDEX idx_attendance_updated_by (updated_by),
        CONSTRAINT fk_attendance_session FOREIGN KEY (attendance_session_id) REFERENCES student_attendance_sessions (id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_admission FOREIGN KEY (admission_id) REFERENCES student_admissions (id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
    );