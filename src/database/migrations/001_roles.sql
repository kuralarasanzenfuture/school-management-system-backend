-- CREATE TABLE IF NOT EXISTS roles (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(100) UNIQUE NOT NULL,
--   description TEXT,
--   status ENUM('active','inactive') DEFAULT 'active',
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
CREATE TABLE
  IF NOT EXISTS roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    /* ===============================
    ROLE DETAILS
    =============================== */
    name VARCHAR(100) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    description VARCHAR(500) NULL,
    /* ===============================
    SYSTEM ROLE
    1 = System role
    0 = Custom role
    =============================== */
    is_system TINYINT (1) NOT NULL DEFAULT 0,
    /* ===============================
    STATUS
    =============================== */
    status ENUM ('active', 'inactive') NOT NULL DEFAULT 'active',
    /* ===============================
    AUDIT
    =============================== */
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    /* ===============================
    PRIMARY KEY
    =============================== */
    PRIMARY KEY (id),
    /* ===============================
    UNIQUE
    =============================== */
    UNIQUE KEY uq_roles_name (name),
    UNIQUE KEY uq_roles_code (role_code),
    /* ===============================
    INDEXES
    =============================== */
    KEY idx_roles_status (status),
    KEY idx_roles_system (is_system),
    KEY idx_roles_created_by (created_by),
    KEY idx_roles_updated_by (updated_by)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;