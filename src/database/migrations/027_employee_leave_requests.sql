CREATE TABLE
    IF NOT EXISTS employee_leave_requests (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        leave_type_id INT NOT NULL,
        from_date DATE,
        to_date DATE,
        total_days DECIMAL(5, 2),
        reason TEXT,
        status ENUM ('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
        approved_by BIGINT NULL,
        approved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id),
        FOREIGN KEY (leave_type_id) REFERENCES employee_leave_types (id)
    );