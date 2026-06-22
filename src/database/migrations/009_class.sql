-- CREATE TABLE IF NOT EXISTS classes (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     school_id INT NOT NULL,
--     name VARCHAR(100) NOT NULL,
--     section VARCHAR(20),

--     FOREIGN KEY (school_id)
--     REFERENCES schools(id)
--     ON DELETE CASCADE
-- );

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,

    name VARCHAR(50) NOT NULL, -- e.g. 10, 9, 1

    status ENUM('active','inactive') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_class (school_id, name),

    FOREIGN KEY (school_id)
    REFERENCES schools(id)
    ON DELETE CASCADE
);