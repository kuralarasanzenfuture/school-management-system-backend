CREATE TABLE employee_designations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    status ENUM('active','inactive')
    DEFAULT 'active',
    
    UNIQUE KEY uq_designation_school (school_id, name),

    FOREIGN KEY (school_id)
    REFERENCES schools(id)
    ON DELETE CASCADE
);