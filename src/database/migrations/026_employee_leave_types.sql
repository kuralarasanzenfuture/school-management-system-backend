-- CREATE TABLE
--     IF NOT EXISTS employee_leave_types (
--         id INT AUTO_INCREMENT PRIMARY KEY,
--         school_id INT NOT NULL,
--         name VARCHAR(100),
--         days_per_year INT,
--         is_paid BOOLEAN DEFAULT TRUE,
--         status ENUM ('active', 'inactive') DEFAULT 'active'
--     );
--     Casual Leave
-- Sick Leave
-- Maternity Leave
-- Paternity Leave
-- Earned Leave
CREATE TABLE
    IF NOT EXISTS employee_leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        description TEXT,
        days_per_year DECIMAL(5, 2) NOT NULL DEFAULT 0,
        max_days_per_request DECIMAL(5, 2) DEFAULT NULL,
        is_paid BOOLEAN DEFAULT TRUE,
        carry_forward BOOLEAN DEFAULT FALSE,
        max_carry_forward_days DECIMAL(5, 2) DEFAULT 0,
        allow_half_day BOOLEAN DEFAULT TRUE,
        requires_approval BOOLEAN DEFAULT TRUE,
        requires_attachment BOOLEAN DEFAULT FALSE,
        applicable_gender ENUM ('all', 'male', 'female') DEFAULT 'all',
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_leave_type (school_id, code),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );