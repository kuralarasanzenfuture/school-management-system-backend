CREATE TABLE
    employee_salary_structure_details (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        salary_structure_id BIGINT NOT NULL,
        component_id INT NOT NULL,
        calculation_type ENUM ('fixed', 'percentage') NOT NULL,
        amount DECIMAL(12, 2) DEFAULT NULL,
        percentage DECIMAL(6, 2) DEFAULT NULL,
        based_on ENUM ('basic', 'gross') DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_structure_component (salary_structure_id, component_id),
        FOREIGN KEY (salary_structure_id) REFERENCES employee_salary_structures (id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES employee_salary_components (id) ON DELETE CASCADE
    );