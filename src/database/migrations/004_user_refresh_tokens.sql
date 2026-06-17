CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    session_id VARCHAR(255) NOT NULL,

    refresh_token_hash VARCHAR(255) NOT NULL,

    ip_address VARCHAR(45),
    user_agent TEXT,

    device_name VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    last_used_at DATETIME NULL,

    revoked_at DATETIME NULL,
    revoked_reason VARCHAR(255) NULL,

    expires_at DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_token_hash (refresh_token_hash),

    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_expires (expires_at)
);