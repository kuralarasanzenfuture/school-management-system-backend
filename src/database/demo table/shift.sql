CREATE TABLE
    employee_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        shift_type ENUM ('day', 'evening', 'night', 'flexible') DEFAULT 'day',
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        crosses_midnight BOOLEAN DEFAULT FALSE,
        grace_minutes INT DEFAULT 10,
        break_minutes INT DEFAULT 0,
        working_hours DECIMAL(5, 2) NOT NULL,
        weekly_off ENUM (
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'None'
        ) DEFAULT 'Sunday',
        is_default BOOLEAN DEFAULT FALSE,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_shift (school_id, name),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );