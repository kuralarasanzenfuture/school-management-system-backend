CREATE TABLE
    employee_salary_components (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(30) NOT NULL,
        component_type ENUM ('earning', 'deduction') NOT NULL,
        calculation_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_component_code (school_id, code),
        UNIQUE KEY uq_component_name (school_id, name),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );