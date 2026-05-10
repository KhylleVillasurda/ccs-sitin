-- ============================================================
-- CCS Sit-in Monitoring System — XAMPP / MySQL Setup Script
-- Run this ONCE in phpMyAdmin (http://localhost:8080/phpmyadmin)
-- ============================================================

CREATE DATABASE IF NOT EXISTS ccs_sitin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ccs_sitin;

CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_number           VARCHAR(50) UNIQUE NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    middle_name         VARCHAR(100) DEFAULT '',
    course_level        INT DEFAULT 1,
    password            VARCHAR(255) NOT NULL,
    email               VARCHAR(150) DEFAULT '',
    course              VARCHAR(50)  DEFAULT 'BSIT',
    address             VARCHAR(255) DEFAULT '',
    role                VARCHAR(20)  DEFAULT 'student',
    remaining_sessions  INT DEFAULT 30,
    profile_picture     LONGTEXT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sit_in_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(50) NOT NULL,
    student_name    VARCHAR(255) NOT NULL,
    purpose         VARCHAR(100) NOT NULL,
    lab             VARCHAR(50)  NOT NULL,
    session         INT DEFAULT 0,
    status          VARCHAR(20)  DEFAULT 'active',
    time_in         DATETIME DEFAULT CURRENT_TIMESTAMP,
    time_out        DATETIME NULL,
    FOREIGN KEY (student_id) REFERENCES users(id_number)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcements (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) DEFAULT '',
    content     TEXT NOT NULL,
    author      VARCHAR(100) DEFAULT 'CCS Admin',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If upgrading from existing install, add the column safely:
-- Note: MySQL 8.0 does not support ADD COLUMN IF NOT EXISTS. 
-- If running this script on an existing DB, ignore errors about duplicate columns.
ALTER TABLE users ADD COLUMN profile_picture LONGTEXT NULL;

CREATE TABLE IF NOT EXISTS reservations (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id       VARCHAR(50)  NOT NULL,
    student_name     VARCHAR(255) NOT NULL,
    lab              VARCHAR(50)  NOT NULL,
    pc_number        INT          NOT NULL,
    purpose          VARCHAR(100) NOT NULL,
    reservation_date DATE         DEFAULT (CURRENT_DATE),
    time_slot        VARCHAR(50)  DEFAULT NULL,
    status           VARCHAR(20)  DEFAULT 'pending',
    notes            TEXT         DEFAULT NULL,
    requested_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    resolved_at      DATETIME     NULL,
    resolved_by      VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id_number)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pc_status (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    lab         VARCHAR(50) NOT NULL,
    pc_number   INT         NOT NULL,
    is_disabled TINYINT(1)  DEFAULT 0,
    UNIQUE KEY uq_lab_pc (lab, pc_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Setup complete!' AS status;
