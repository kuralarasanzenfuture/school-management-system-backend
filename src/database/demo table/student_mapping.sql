CREATE TABLE student_class_map (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    class_section_id INT NOT NULL,

    roll_number INT,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_student_year (student_id, class_section_id),

    FOREIGN KEY (class_section_id)
    REFERENCES class_sections(id)
    ON DELETE CASCADE
);