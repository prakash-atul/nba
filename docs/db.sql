-- =============================================
-- NBA DATABASE SCHEMA
-- Database: nba_db
-- Purpose: Manage courses, tests, and CO-based assessments
-- =============================================
USE `nba_db`;
-- =============================================
-- TABLES
-- =============================================
-- Departments
DROP TABLE IF EXISTS `rawMarks`;
DROP TABLE IF EXISTS `marks`;
DROP TABLE IF EXISTS `enrollment`;
DROP TABLE IF EXISTS `question`;
DROP TABLE IF EXISTS `test`;
DROP TABLE IF EXISTS `co_po_mapping`;
DROP TABLE IF EXISTS `attainment_scale`;
DROP TABLE IF EXISTS `course`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;

CREATE TABLE `departments` (
    `department_id` INT(11) NOT NULL AUTO_INCREMENT,
    `department_name` VARCHAR(100) NOT NULL,
    `department_code` VARCHAR(10) NOT NULL,
    PRIMARY KEY (`department_id`),
    UNIQUE KEY (`department_name`),
    UNIQUE KEY (`department_code`)
);
-- Users (Admin, HOD, Faculty, Staff)
CREATE TABLE `users` (
    `employee_id` INT(11) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `email` VARCHAR(64) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'dean', 'hod', 'faculty', 'staff') NOT NULL,
    `department_id` INT(11) NULL,
    PRIMARY KEY (`employee_id`),
    UNIQUE KEY (`email`),
    INDEX (`department_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE
    SET NULL
);
-- Students
CREATE TABLE `student` (
    `rollno` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `dept` INT(11) NOT NULL,
    PRIMARY KEY (`rollno`),
    INDEX (`dept`),
    FOREIGN KEY (`dept`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT
);
-- Courses
CREATE TABLE `course` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `credit` SMALLINT NOT NULL DEFAULT 0,
    `syllabus_pdf` LONGBLOB,
    `faculty_id` INT(11) NOT NULL,
    `year` INT NOT NULL CHECK (
        `year` BETWEEN 1000 AND 9999
    ),
    `semester` INT NOT NULL,
    `co_threshold` DECIMAL(5, 2) DEFAULT 40.00 CHECK (
        `co_threshold` >= 0
        AND `co_threshold` <= 100
    ),
    `passing_threshold` DECIMAL(5, 2) DEFAULT 60.00 CHECK (
        `passing_threshold` >= 0
        AND `passing_threshold` <= 100
    ),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`course_code`),
    INDEX (`faculty_id`),
    INDEX (`year`, `semester`),
    FOREIGN KEY (`faculty_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT
);
-- Attainment Scale (configurable thresholds per course)
CREATE TABLE `attainment_scale` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `level` SMALLINT NOT NULL CHECK (
        `level` >= 0
        AND `level` <= 10
    ),
    `min_percentage` DECIMAL(5, 2) NOT NULL CHECK (
        `min_percentage` >= 0
        AND `min_percentage` <= 100
    ),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`course_id`, `level`),
    INDEX (`course_id`),
    FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
);
-- Create CO-PO Mapping Table
CREATE TABLE `co_po_mapping` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `co_name` VARCHAR(5) NOT NULL,
    -- CO1, CO2, ... CO6
    `po_name` VARCHAR(5) NOT NULL,
    -- PO1..PO12, PSO1..PSO3
    `value` TINYINT NOT NULL DEFAULT 0 CHECK (
        `value` BETWEEN 0 AND 3
    ),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_mapping` (`course_id`, `co_name`, `po_name`),
    FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
);
-- Tests
CREATE TABLE `test` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `full_marks` INT NOT NULL CHECK (`full_marks` > 0),
    `pass_marks` INT NOT NULL CHECK (`pass_marks` >= 0),
    `question_paper_pdf` LONGBLOB,
    PRIMARY KEY (`id`),
    INDEX (`course_id`),
    FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
);
-- Questions (supports main question, sub-questions, optional)
CREATE TABLE `question` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `test_id` BIGINT NOT NULL,
    `question_number` SMALLINT NOT NULL CHECK (
        `question_number` BETWEEN 1 AND 20
    ),
    `sub_question` VARCHAR(10) DEFAULT NULL,
    -- a-h or NULL
    `is_optional` BOOLEAN DEFAULT FALSE,
    -- for "Attempt either A OR B"
    `co` SMALLINT NOT NULL CHECK (
        `co` BETWEEN 1 AND 6
    ),
    `max_marks` DECIMAL(5, 2) NOT NULL CHECK (`max_marks` >= 0.5),
    PRIMARY KEY (`id`),
    INDEX (`test_id`),
    INDEX (`test_id`, `question_number`),
    UNIQUE KEY (`test_id`, `question_number`, `sub_question`),
    FOREIGN KEY (`test_id`) REFERENCES `test`(`id`) ON DELETE CASCADE
);
-- Course Enrollment (tracks which students are enrolled in which courses)
CREATE TABLE `enrollment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `student_rollno` VARCHAR(20) NOT NULL,
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`course_id`, `student_rollno`),
    INDEX (`course_id`),
    INDEX (`student_rollno`),
    FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_rollno`) REFERENCES `student`(`rollno`) ON DELETE CASCADE
);
-- Raw Marks (per-question scores, dropped every semester)
CREATE TABLE `rawMarks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `test_id` BIGINT NOT NULL,
    `student_id` VARCHAR(20) NOT NULL,
    `question_id` BIGINT NOT NULL,
    `marks` DECIMAL(5, 2) NOT NULL CHECK (`marks` >= 0),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`test_id`, `student_id`, `question_id`),
    INDEX (`test_id`, `student_id`),
    INDEX (`student_id`),
    FOREIGN KEY (`test_id`) REFERENCES `test`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `student`(`rollno`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE CASCADE
);
-- Marks (CO-aggregated scores per student per test)
CREATE TABLE `marks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(20) NOT NULL,
    `test_id` BIGINT NOT NULL,
    `CO1` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO1` >= 0),
    `CO2` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO2` >= 0),
    `CO3` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO3` >= 0),
    `CO4` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO4` >= 0),
    `CO5` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO5` >= 0),
    `CO6` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO6` >= 0),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`student_id`, `test_id`),
    INDEX (`test_id`),
    FOREIGN KEY (`student_id`) REFERENCES `student`(`rollno`) ON DELETE CASCADE,
    FOREIGN KEY (`test_id`) REFERENCES `test`(`id`) ON DELETE CASCADE
);
-- Departments
INSERT INTO `departments` (`department_name`, `department_code`)
VALUES ('Computer Science & Engineering', 'CSE'),
    ('Electronics & Communication Engineering', 'ECE');
-- password: password123
INSERT INTO `users`
VALUES (
        1001,
        'Admin One',
        'admin_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'admin',
        NULL
    ),
    (
        2001,
        'HOD CSE',
        'hod_cse@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        1
    ),
    (
        2002,
        'HOD ECE',
        'hod_ece@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        2
    ),
    (
        3001,
        'Faculty One',
        'faculty_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3002,
        'Faculty Two',
        'faculty_02@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3003,
        'Faculty Three',
        'faculty_03@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3004,
        'Faculty Four',
        'faculty_04@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3005,
        'Faculty Five',
        'faculty_05@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        2
    ),
    (
        3006,
        'Faculty Six',
        'faculty_06@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        2
    ),
    (
        4001,
        'Staff One',
        'staff_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'staff',
        1
    ),
    (
        4002,
        'Staff Two',
        'staff_02@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'staff',
        2
    );
-- Courses
INSERT INTO `course` (
        `id`,
        `course_code`,
        `name`,
        `credit`,
        `syllabus_pdf`,
        `faculty_id`,
        `year`,
        `semester`
    )
VALUES (
        1,
        'CS101',
        'Introduction to Programming',
        4,
        NULL,
        3001,
        2024,
        1
    ),
    (
        2,
        'CS201',
        'Data Structures and Algorithms',
        4,
        NULL,
        3001,
        2024,
        1
    ),
    (
        3,
        'CS301',
        'Database Management Systems',
        3,
        NULL,
        3002,
        2024,
        1
    ),
    (
        4,
        'CS302',
        'Computer Networks',
        3,
        NULL,
        3004,
        2024,
        2
    );