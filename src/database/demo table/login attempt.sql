-- Additional Tables Worth Having
-- Login Audit Log

-- Tracks every login attempt.

CREATE TABLE IF NOT EXISTS login_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    email VARCHAR(150),

    ip_address VARCHAR(45),

    user_agent TEXT,

    login_status ENUM('success','failed'),

    failure_reason VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);