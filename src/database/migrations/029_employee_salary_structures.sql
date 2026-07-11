CREATE TABLE
    employee_salary_structures (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        effective_from DATE,
        basic_salary DECIMAL(12, 2),
        hra DECIMAL(12, 2),
        da DECIMAL(12, 2),
        allowance DECIMAL(12, 2),
        other_allowance DECIMAL(12, 2),
        pf DECIMAL(12, 2),
        esi DECIMAL(12, 2),
        professional_tax DECIMAL(12, 2),
        income_tax DECIMAL(12, 2),
        other_deduction DECIMAL(12, 2),
        status ENUM ('active', 'inactive') DEFAULT 'active',
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    );