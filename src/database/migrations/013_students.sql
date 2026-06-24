CREATE TABLE IF NOT EXISTS students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    school_id INT NOT NULL,

    student_code VARCHAR(50) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150),
    mobile_no VARCHAR(20) NOT NULL,

    date_of_birth DATE,
    gender ENUM('male','female','other'),

    blood_group VARCHAR(10),
    aadhaar_no VARCHAR(20),

    religion VARCHAR(100),
    nationality VARCHAR(100) DEFAULT 'INDIAN',
    mother_tongue VARCHAR(100),

    photo_url VARCHAR(500),

    -- Address
    current_area VARCHAR(100),
    current_city VARCHAR(100),
    current_district VARCHAR(100),
    current_state VARCHAR(100),
    current_postal_code VARCHAR(20),
    current_address TEXT,

    current_address_same_as_permanent BOOLEAN DEFAULT FALSE,
    permanent_address TEXT,
    permanent_area VARCHAR(100),
    permanent_city VARCHAR(100),
    permanent_district VARCHAR(100),
    permanent_state VARCHAR(100),
    permanent_postal_code VARCHAR(20),

    -- documents
    birth_certificate_url VARCHAR(500),
    -- aadhaar_card_url VARCHAR(500),
    aadhaar_front_url VARCHAR(500),
    aadhaar_back_url VARCHAR(500),
    transfer_certificate_url VARCHAR(500),
    previous_marksheets_url VARCHAR(500),
  --  passport_size_photo_url VARCHAR(500),

    -- parents
    father_name VARCHAR(150),

    mother_name VARCHAR(150),

    father_occupation VARCHAR(150),

    mother_occupation VARCHAR(150),

    parent_mobile VARCHAR(20),

    alternate_mobile VARCHAR(20),

    parent_email VARCHAR(150),

    emergency_contact VARCHAR(20),

    emergency_relationship VARCHAR(100),

    -- Medical
    -- allergies TEXT,
    -- chronic_conditions TEXT,
   -- family_doctor_name VARCHAR(150),

    status ENUM(
        'active',
        'graduated',
        'transferred',
        'dropped'
    ) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (school_id) REFERENCES schools(id),

    UNIQUE KEY uq_student_code (student_code),
    -- UNIQUE KEY uq_email (email),
   -- UNIQUE KEY uq_mobile_no (mobile_no),
    UNIQUE KEY uq_aadhaar_no (aadhaar_no)

);