CREATE TABLE
    employee_documents (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT UNSIGNED NOT NULL,
        document_type VARCHAR(100),
        file_name VARCHAR(255),
        file_url VARCHAR(500),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    );