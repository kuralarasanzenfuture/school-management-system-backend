Main Structure:
students
student_admissions
student_guardians
student_addresses
student_medical_info
student_documents
student_fee_profiles

1. Students (Personal Information)
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NOT NULL,

    admission_no VARCHAR(50) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150),
    mobile VARCHAR(20),

    gender ENUM('male','female','other'),

    dob DATE,

    blood_group VARCHAR(10),

    aadhaar_no VARCHAR(20),

    religion VARCHAR(100),
    mother_tongue VARCHAR(100),

    photo_url VARCHAR(500),

    status ENUM(
        'active',
        'graduated',
        'transferred',
        'dropped'
    ) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

2. Student Admissions

Step 2: Academic

This stores yearly history.

CREATE TABLE student_admissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    academic_year VARCHAR(20) NOT NULL,

    class_name VARCHAR(50) NOT NULL,

    section VARCHAR(20),

    roll_no VARCHAR(20),

    joining_date DATE,

    previous_school_name VARCHAR(255),

    house_name VARCHAR(100),

    subject_group VARCHAR(100),

    transport_required BOOLEAN DEFAULT FALSE,

    hostel_required BOOLEAN DEFAULT FALSE,

    admission_type ENUM(
        'new',
        'promoted',
        'transfer'
    ) DEFAULT 'new',

    status ENUM(
        'active',
        'completed',
        'transferred',
        'dropped'
    ) DEFAULT 'active',

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

3. Student Guardians

Step 3: Parental

CREATE TABLE student_guardians (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    father_name VARCHAR(150),

    mother_name VARCHAR(150),

    occupation VARCHAR(150),

    parent_mobile VARCHAR(20),

    alternate_mobile VARCHAR(20),

    parent_email VARCHAR(150),

    emergency_contact VARCHAR(20),

    emergency_relationship VARCHAR(100),

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

4. Student Addresses

Step 4: Address

CREATE TABLE student_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    permanent_address TEXT NOT NULL,

    current_address TEXT NOT NULL,

    city VARCHAR(100),

    district VARCHAR(100),

    state VARCHAR(100),

    postal_code VARCHAR(20),

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

5. Student Medical Information

Step 4: Medical

CREATE TABLE student_medical_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    allergies TEXT,

    chronic_conditions TEXT,

    family_doctor_name VARCHAR(150),

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

6. Student Documents

Step 5: Documents

CREATE TABLE student_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    document_type ENUM(
        'birth_certificate',
        'transfer_certificate',
        'aadhaar_copy',
        'marksheet',
        'photo',
        'parent_signature',
        'other'
    ),

    file_name VARCHAR(255),

    file_url VARCHAR(500),

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);

7. Student Fee Profile

Step 5: Fees

CREATE TABLE student_fee_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,

    fee_category VARCHAR(100),

    scholarship_details TEXT,

    transport_fee_required BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);
