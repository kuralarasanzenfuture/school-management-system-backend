-- CREATE TABLE
--     IF NOT EXISTS employee_leave_requests (
--         id BIGINT AUTO_INCREMENT PRIMARY KEY,
--         employee_id BIGINT NOT NULL,
--         leave_type_id INT NOT NULL,
--         from_date DATE,
--         to_date DATE,
--         total_days DECIMAL(5, 2),
--         reason TEXT,
--         status ENUM ('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
--         approved_by BIGINT NULL,
--         approved_at DATETIME NULL,
--         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--         FOREIGN KEY (employee_id) REFERENCES employees (id),
--         FOREIGN KEY (leave_type_id) REFERENCES employee_leave_types (id)
--     );
CREATE TABLE
    IF NOT EXISTS employee_leave_requests (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        leave_type_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        total_days DECIMAL(5, 2) NOT NULL,
        is_half_day BOOLEAN DEFAULT FALSE,
        half_day_session ENUM ('morning', 'afternoon') NULL,
        reason TEXT,
        attachment_url VARCHAR(500),
        status ENUM ('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
        FOREIGN KEY (leave_type_id) REFERENCES employee_leave_types (id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE CASCADE
    );