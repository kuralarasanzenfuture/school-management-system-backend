CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),

    FOREIGN KEY (school_id)
    REFERENCES schools(id)
    ON DELETE CASCADE
);