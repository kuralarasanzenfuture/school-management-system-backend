CREATE TABLE
    IF NOT EXISTS employee_salary_components (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(30) NOT NULL,
        component_type ENUM ('earning', 'deduction') NOT NULL,
        calculation_type ENUM ('fixed', 'percentage') DEFAULT 'fixed',
        -- is_taxable BOOLEAN DEFAULT FALSE,
        status ENUM ('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_component_code (school_id, code),
        UNIQUE KEY uq_component_name (school_id, name),
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
    );

--     CREATE TABLE employee_salary_components (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     school_id INT NOT NULL,
--     name VARCHAR(100) NOT NULL,
--     code VARCHAR(30) NOT NULL,
--     component_type ENUM('earning','deduction') NOT NULL,
--     calculation_type ENUM('fixed','percentage') DEFAULT 'fixed',
--     default_value DECIMAL(12,2) DEFAULT 0,
--     percentage_of VARCHAR(30) DEFAULT NULL,
--     is_taxable BOOLEAN DEFAULT FALSE,
--     is_pf_applicable BOOLEAN DEFAULT FALSE,
--     is_esi_applicable BOOLEAN DEFAULT FALSE,
--     display_order INT DEFAULT 0,
--     is_system BOOLEAN DEFAULT FALSE,
--     is_active BOOLEAN DEFAULT TRUE,
--     status ENUM('active','inactive') DEFAULT 'active',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--         DEFAULT CURRENT_TIMESTAMP
--         ON UPDATE CURRENT_TIMESTAMP,
--     UNIQUE KEY uq_component_code (school_id, code),
--     UNIQUE KEY uq_component_name (school_id, name),
--     FOREIGN KEY (school_id)
--         REFERENCES schools(id)
--         ON DELETE CASCADE
-- );