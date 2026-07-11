CREATE TABLE
    IF NOT EXISTS employee_leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100),
        days_per_year INT,
        is_paid BOOLEAN DEFAULT TRUE,
        status ENUM ('active', 'inactive') DEFAULT 'active'
    );

--     Casual Leave
-- Sick Leave
-- Maternity Leave
-- Paternity Leave
-- Earned Leave