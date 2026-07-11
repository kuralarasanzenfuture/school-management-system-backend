CREATE TABLE
    IF NOT EXISTS employee_leave_balances (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        leave_type_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        allotted_days DECIMAL(5, 2),
        used_days DECIMAL(5, 2),
        remaining_days DECIMAL(5, 2),
        UNIQUE KEY uq_leave (employee_id, leave_type_id, academic_year_id)
    );