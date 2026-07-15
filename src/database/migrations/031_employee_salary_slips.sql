-- CREATE TABLE
--     IF NOT EXISTS employee_salary_slips (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         payroll_id BIGINT NOT NULL,
--         slip_number VARCHAR(50) UNIQUE,
--         generated_at DATETIME,
--         pdf_url VARCHAR(500),
--         FOREIGN KEY (payroll_id) REFERENCES employee_payroll (id)
--     );
CREATE TABLE
    IF NOT EXISTS employee_salary_slips (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        payroll_id BIGINT NOT NULL,
        slip_number VARCHAR(50) UNIQUE NOT NULL,
        generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        pdf_url VARCHAR(500),
        emailed BOOLEAN DEFAULT FALSE,
        emailed_at DATETIME NULL,
        downloaded_count INT DEFAULT 0,
        status ENUM ('generated', 'sent', 'cancelled') DEFAULT 'generated',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (payroll_id) REFERENCES employee_payroll (id) ON DELETE CASCADE
    );