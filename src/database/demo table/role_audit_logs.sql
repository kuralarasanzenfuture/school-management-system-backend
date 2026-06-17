-- Role Change Audit (Very Useful)

-- Since users can have multiple roles:

CREATE TABLE IF NOT EXISTS role_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    role_id INT NOT NULL,

    action ENUM('assigned','removed'),

    changed_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);