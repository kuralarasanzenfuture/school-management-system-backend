-- CREATE TABLE
--     IF NOT EXISTS employee_shifts (
--         id INT AUTO_INCREMENT PRIMARY KEY,
--         school_id INT NOT NULL,
--         name VARCHAR(100) NOT NULL,
--         start_time TIME,
--         end_time TIME,
--         grace_minutes INT DEFAULT 10,
--         working_hours DECIMAL(4, 2),
--         status ENUM ('active', 'inactive') DEFAULT 'active',
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--         INDEX (school_id),
--         INDEX (status),
--         UNIQUE KEY uq_shift (school_id, name),
--         CHECK (working_hours > 0),
--         CHECK (grace_minutes >= 0),
--         CHECK (start_time < end_time),
--         FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
--     );
CREATE TABLE
    IF NOT EXISTS employee_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        shift_type ENUM ('day', 'evening', 'night', 'flexible') DEFAULT 'day',
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        crosses_midnight BOOLEAN DEFAULT FALSE,
        grace_minutes INT DEFAULT 10,
        working_hours DECIMAL(5, 2) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_shift (school_id, name),
        CHECK (grace_minutes >= 0),
        CHECK (working_hours > 0),
        CHECK (
            (
                crosses_midnight = FALSE
                AND start_time < end_time
            )
            OR (crosses_midnight = TRUE)
        ),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );