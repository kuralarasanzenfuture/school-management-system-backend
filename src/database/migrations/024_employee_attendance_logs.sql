-- If biometric/RFID/mobile app is used.
CREATE TABLE
    IF NOT EXISTS employee_attendance_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        log_time DATETIME NOT NULL,
        log_type ENUM ('check_in', 'check_out'),
        device_name VARCHAR(100),
        device_ip VARCHAR(100),
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    );