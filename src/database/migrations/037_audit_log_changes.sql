CREATE TABLE
   IF NOT EXISTS audit_log_changes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      /* =========================================================
      MAIN AUDIT LOG
      ========================================================= */
      audit_log_id BIGINT UNSIGNED NOT NULL,
      /* =========================================================
      FIELD
      ========================================================= */
      field_name VARCHAR(100) NOT NULL,
      field_label VARCHAR(150) NULL,
      /* =========================================================
      DATA TYPE
      ========================================================= */
      data_type VARCHAR(50) NULL,
      /* =========================================================
      OLD VALUE
      ========================================================= */
      old_value TEXT NULL,
      /* =========================================================
      NEW VALUE
      ========================================================= */
      new_value TEXT NULL,
      /* =========================================================
      CREATED
      ========================================================= */
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_audit_change_log (audit_log_id),
      KEY idx_audit_change_field (field_name),
      CONSTRAINT fk_audit_change_log FOREIGN KEY (audit_log_id) REFERENCES audit_logs (id) ON DELETE CASCADE
   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;