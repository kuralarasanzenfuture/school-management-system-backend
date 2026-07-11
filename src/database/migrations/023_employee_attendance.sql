CREATE TABLE
    IF NOT EXISTS employee_attendance (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        employee_id BIGINT NOT NULL,
        attendance_date DATE NOT NULL,
        status ENUM (
            'present',
            'absent',
            'late',
            'half_day',
            'leave',
            'holiday',
            'week_off'
        ) NOT NULL,
        shift_id INT NULL,
        check_in DATETIME NULL,
        check_out DATETIME NULL,
        total_work_minutes INT DEFAULT 0,
        overtime_minutes INT DEFAULT 0,
        late_minutes INT DEFAULT 0,
        remarks VARCHAR(500),
        marked_by BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_employee_date (employee_id, attendance_date),
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (school_id) REFERENCES schools (id)
    );