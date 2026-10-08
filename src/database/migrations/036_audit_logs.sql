CREATE TABLE
    IF NOT EXISTS audit_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        /* =========================================================
        SCHOOL
        ========================================================= */
        school_id BIGINT UNSIGNED NULL,
        /* =========================================================
        USER WHO PERFORMED THE ACTION
        ========================================================= */
        user_id BIGINT UNSIGNED NULL,
        /* =========================================================
        ACTION
        ========================================================= */
        action ENUM (
            'CREATE',
            'UPDATE',
            'DELETE',
            'RESTORE',
            'ACTIVATE',
            'DEACTIVATE',
            'LOGIN',
            'LOGOUT',
            'LOGIN_FAILED',
            'PASSWORD_CHANGE',
            'PASSWORD_RESET',
            'APPROVE',
            'REJECT',
            'SUBMIT',
            'CANCEL',
            'EXPORT',
            'IMPORT',
            'DOWNLOAD',
            'UPLOAD',
            'PRINT',
            'VIEW'
        ) NOT NULL,
        /* =========================================================
        MODULE
        ========================================================= */
        module VARCHAR(100) NOT NULL,
        /*
        users
        students
        teachers
        classes
        subjects
        attendance
        fees
        exams
        results
        etc.
         */
        /* =========================================================
        ENTITY / TABLE
        ========================================================= */
        entity_type VARCHAR(100) NOT NULL,
        /*
        user
        student
        teacher
        class
        fee
        attendance
        exam
        etc.
         */
        entity_id BIGINT UNSIGNED NULL,
        /* =========================================================
        RECORD IDENTIFICATION
        ========================================================= */
        entity_name VARCHAR(255) NULL,
        /* =========================================================
        DESCRIPTION
        ========================================================= */
        description VARCHAR(1000) NULL,
        /* =========================================================
        OLD DATA
        Complete record before change
        ========================================================= */
        old_data JSON NULL,
        /* =========================================================
        NEW DATA
        Complete record after change
        ========================================================= */
        new_data JSON NULL,
        change_data JSON NULL,
        /* =========================================================
        REQUEST INFORMATION
        ========================================================= */
        request_id VARCHAR(100) NULL,
        request_method VARCHAR(20) NULL,
        request_url VARCHAR(1000) NULL,
        /* =========================================================
        IP / DEVICE INFORMATION
        ========================================================= */
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(1000) NULL,
        device_type VARCHAR(50) NULL,
        device_name VARCHAR(255) NULL,
        operating_system VARCHAR(100) NULL,
        browser VARCHAR(100) NULL,
        /* =========================================================
        RESULT
        ========================================================= */
        status ENUM ('success', 'failed') NOT NULL DEFAULT 'success',
        error_message VARCHAR(1000) NULL,
        /* =========================================================
        TIMESTAMP
        ========================================================= */
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        /* =========================================================
        PRIMARY KEY
        ========================================================= */
        PRIMARY KEY (id),
        /* =========================================================
        INDEXES
        ========================================================= */
        KEY idx_audit_school (school_id),
        KEY idx_audit_user (user_id),
        KEY idx_audit_action (action),
        KEY idx_audit_module (module),
        KEY idx_audit_entity (entity_type, entity_id),
        KEY idx_audit_request (request_id),
        KEY idx_audit_status (status),
        KEY idx_audit_created_at (created_at),
        KEY idx_audit_school_created (school_id, created_at),
        KEY idx_audit_user_created (user_id, created_at),
        CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE SET NULL,
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;