USE rfid_attendance;

CREATE TABLE students (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nis        VARCHAR(20)  NOT NULL,
    name       VARCHAR(100) NOT NULL,
    class      VARCHAR(20)  NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_students_nis UNIQUE (nis)
) ENGINE=InnoDB;

CREATE TABLE cards (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uid        VARCHAR(24)  NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cards_uid UNIQUE (uid),
    CONSTRAINT fk_cards_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendance (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    date       DATE         NOT NULL,
    time       TIME         NOT NULL,
    status     ENUM('Hadir', 'Terlambat') NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_attendance_student_date UNIQUE (student_id, date),
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE settings (
    `key`       VARCHAR(50)  PRIMARY KEY,
    `value`     VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_students_active ON students(is_active);

INSERT INTO settings (`key`, `value`, description) VALUES
('late_threshold', '07:00:00', 'Batas jam keterlambatan'),
('school_name', 'SMK Negeri 1 Contoh', 'Nama sekolah');