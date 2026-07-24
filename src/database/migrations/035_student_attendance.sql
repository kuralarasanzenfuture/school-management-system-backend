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
    student_attendance (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        attendance_session_id BIGINT NOT NULL,
        admission_id BIGINT NOT NULL,
        attendance_status ENUM ('present', 'absent', 'late', 'half_day', 'leave') NOT NULL,
        remarks VARCHAR(255),
        marked_by BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_attendance (attendance_session_id, admission_id),
        INDEX (admission_id),
        INDEX (attendance_session_id),
        INDEX (marked_by),
        FOREIGN KEY (attendance_session_id) REFERENCES student_attendance_sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (admission_id) REFERENCES student_admissions (id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES employees (id)
    );