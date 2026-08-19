USE rfid_attendance;

CREATE TABLE students (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nis        VARCHAR(32)  NOT NULL,
    name       VARCHAR(128) NOT NULL,
    class      VARCHAR(16)  NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_students_nis UNIQUE (nis)
) ENGINE=InnoDB;

CREATE TABLE cards (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    uid        VARCHAR(32) NOT NULL,
    student_id INT         NOT NULL,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cards_uid UNIQUE (uid),
    CONSTRAINT fk_cards_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendance (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    student_id INT          NOT NULL,
    date       DATE         NOT NULL,
    time       TIME         NOT NULL,
    status     VARCHAR(20)  NOT NULL,
    keterangan VARCHAR(255) NULL,

    CONSTRAINT uq_attendance_student_date UNIQUE (student_id, date),
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE settings (
    `key`   VARCHAR(64)  PRIMARY KEY,
    `value` VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class         VARCHAR(20)  NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_students_active ON students(is_active);

INSERT INTO settings (`key`, `value`) VALUES
('late_threshold', '07:00:00'),
('school_name', 'SMK Negeri 1 Contoh');
