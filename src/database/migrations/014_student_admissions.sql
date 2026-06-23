-- CREATE TABLE IF NOT EXISTS student_admissions (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     student_id BIGINT NOT NULL,
--     academic_year VARCHAR(20) NOT NULL,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(20),
--     roll_no VARCHAR(20),
--     joining_date DATE,
--     -- previous_school_name VARCHAR(255),
--     -- house_name VARCHAR(100),
--     subject_group VARCHAR(100),
--     transport_required BOOLEAN DEFAULT FALSE,
--     hostel_required BOOLEAN DEFAULT FALSE,
--     admission_type ENUM(
--         'new',
--         'promoted',
--         'transfer'
--     ) DEFAULT 'new',
--     status ENUM(
--         'active',
--         'completed',
--         'transferred',
--         'dropped'
--     ) DEFAULT 'active',
--     FOREIGN KEY (student_id)
--         REFERENCES students(id)
--         ON DELETE CASCADE
-- );
CREATE TABLE
    IF NOT EXISTS student_admissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        student_id BIGINT NOT NULL,
        admission_number VARCHAR(20) NOT NULL,
        admission_date DATE NOT NULL,
        academic_year_id INT NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        class_id INT NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        section VARCHAR(20),
        roll_no VARCHAR(20),
        joining_date DATE,
        subject_group VARCHAR(100),
        transport_required BOOLEAN DEFAULT FALSE,
        hostel_required BOOLEAN DEFAULT FALSE,
        admission_type ENUM ('new', 'promoted', 'transfer') DEFAULT 'new',
        status ENUM ('active', 'completed', 'transferred', 'dropped') DEFAULT 'active',
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON DELETE CASCADE,
        UNIQUE KEY uq_admission_number (admission_number),
        UNIQUE KEY student_year_class (student_id, academic_year_id, class_id)
    );