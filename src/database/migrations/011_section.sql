CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,

    name VARCHAR(20) NOT NULL, -- A, B, C

    capacity INT DEFAULT NULL,

    status ENUM('active','inactive') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_section (class_id, name),

    FOREIGN KEY (class_id)
    REFERENCES classes(id)
    ON DELETE CASCADE
);