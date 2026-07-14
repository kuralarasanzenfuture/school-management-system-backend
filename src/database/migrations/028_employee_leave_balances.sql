-- CREATE TABLE
--     IF NOT EXISTS employee_leave_balances (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         employee_id BIGINT NOT NULL,
--         leave_type_id INT NOT NULL,
--         academic_year_id INT NOT NULL,
--         allotted_days DECIMAL(5, 2),
--         used_days DECIMAL(5, 2),
--         remaining_days DECIMAL(5, 2),
--         UNIQUE KEY uq_leave (employee_id, leave_type_id, academic_year_id)
--     );
CREATE TABLE
    IF NOT EXISTS employee_leave_balances (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        leave_type_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        allotted_days DECIMAL(5, 2) NOT NULL DEFAULT 0,
        carried_forward_days DECIMAL(5, 2) DEFAULT 0,
        used_days DECIMAL(5, 2) DEFAULT 0,
        remaining_days DECIMAL(5, 2) NOT NULL DEFAULT 0,
        last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_leave_balance (employee_id, leave_type_id, academic_year_id),
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
        FOREIGN KEY (leave_type_id) REFERENCES employee_leave_types (id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE CASCADE
    );