CREATE TABLE
    IF NOT EXISTS employee_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100),
        start_time TIME,
        end_time TIME,
        grace_minutes INT DEFAULT 10,
        working_hours DECIMAL(4, 2),
        status ENUM ('active', 'inactive') DEFAULT 'active'
    );