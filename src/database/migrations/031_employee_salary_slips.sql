CREATE TABLE
    IF NOT EXISTS employee_salary_slips (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        payroll_id BIGINT NOT NULL,
        slip_number VARCHAR(50) UNIQUE,
        generated_at DATETIME,
        pdf_url VARCHAR(500),
        FOREIGN KEY (payroll_id) REFERENCES employee_payroll (id)
    );