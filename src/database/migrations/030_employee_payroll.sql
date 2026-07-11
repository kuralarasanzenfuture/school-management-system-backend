CREATE TABLE
    IF NOT EXISTS employee_payroll (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        salary_year INT,
        salary_month INT,
        total_working_days INT,
        present_days DECIMAL(5, 2),
        absent_days DECIMAL(5, 2),
        leave_days DECIMAL(5, 2),
        overtime_hours DECIMAL(6, 2),
        gross_salary DECIMAL(12, 2),
        total_deductions DECIMAL(12, 2),
        net_salary DECIMAL(12, 2),
        payroll_status ENUM ('draft', 'processed', 'paid') DEFAULT 'draft',
        processed_at DATETIME,
        UNIQUE KEY uq_payroll (employee_id, salary_year, salary_month),
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    );