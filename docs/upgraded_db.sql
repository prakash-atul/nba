-- =============================================
-- NBA DATABASE SCHEMA - CONSOLIDATED
-- Version: 3.0 (Phase 1 + Phase 2 + Phase 3)
-- Database: nba_db
-- Purpose: Manage courses, tests, and CO-based assessments with assignment-based roles
-- Date: February 15, 2026
-- =============================================

USE `nba_db`;

-- =============================================
-- DROP TABLES (Reverse Dependency Order)
-- =============================================

DROP TABLE IF EXISTS `raw_marks`;
DROP TABLE IF EXISTS `marks`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `tests`;
DROP TABLE IF EXISTS `co_po_mapping`;
DROP TABLE IF EXISTS `attainment_scale`;
DROP TABLE IF EXISTS `course_faculty_assignments`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `hod_assignments`;
DROP TABLE IF EXISTS `dean_assignments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `schools`;

-- =============================================
-- CORE TABLES
-- =============================================

-- Schools (grouping of departments)
CREATE TABLE `schools` (
    `school_id` INT(11) NOT NULL AUTO_INCREMENT,
    `school_code` VARCHAR(10) NOT NULL,
    `school_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`school_id`),
    UNIQUE KEY `uk_school_code` (`school_code`),
    UNIQUE KEY `uk_school_name` (`school_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments
CREATE TABLE `departments` (
    `department_id` INT(11) NOT NULL AUTO_INCREMENT,
    `school_id` INT(11) NULL,
    `department_name` VARCHAR(100) NOT NULL,
    `department_code` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`department_id`),
    UNIQUE KEY (`department_name`),
    UNIQUE KEY (`department_code`),
    INDEX (`school_id`),
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (Admin, Faculty, Staff)
-- Note: HOD and Dean roles are managed via assignment tables
CREATE TABLE `users` (
    `employee_id` INT(11) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `email` VARCHAR(64) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'faculty', 'staff') NOT NULL,
    `department_id` INT(11) NULL,
    `designation` VARCHAR(50) NULL,
    `phone` VARCHAR(15) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`employee_id`),
    UNIQUE KEY (`email`),
    INDEX (`department_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HOD Assignments (Historical tracking of HOD appointments)
CREATE TABLE `hod_assignments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `department_id` INT(11) NOT NULL,
    `employee_id` INT(11) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `is_current` TINYINT(1) DEFAULT 1,
    `appointment_order` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_dept_emp_start` (`department_id`, `employee_id`, `start_date`),
    INDEX `idx_dept_current` (`department_id`, `is_current`),
    INDEX `idx_employee` (`employee_id`),
    INDEX `idx_dates` (`start_date`, `end_date`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE CASCADE,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dean Assignments (Historical tracking of Dean appointments)
CREATE TABLE `dean_assignments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `school_id` INT(11) NOT NULL,
    `employee_id` INT(11) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `is_current` TINYINT(1) DEFAULT 1,
    `appointment_order` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_school_emp_start` (`school_id`, `employee_id`, `start_date`),
    INDEX `idx_school_current` (`school_id`, `is_current`),
    INDEX `idx_employee` (`employee_id`),
    INDEX `idx_dates` (`start_date`, `end_date`),
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE CASCADE,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students
CREATE TABLE `students` (
    `roll_no` VARCHAR(20) NOT NULL,
    `student_name` VARCHAR(100) NOT NULL,
    `department_id` INT(11) NOT NULL,
    `batch_year` INT NULL,
    `student_status` ENUM('Active', 'Graduated', 'Dropped') DEFAULT 'Active',
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(15) NULL,
    PRIMARY KEY (`roll_no`),
    INDEX `idx_students_dept` (`department_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses
CREATE TABLE `courses` (
    `course_id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_code` VARCHAR(20) NOT NULL,
    `department_id` INT(11) NULL,
    `course_name` VARCHAR(255) NOT NULL,
    `course_type` ENUM('Theory', 'Lab', 'Project', 'Seminar') DEFAULT 'Theory',
    `course_level` ENUM('Undergraduate', 'Postgraduate') DEFAULT 'Undergraduate',
    `is_active` TINYINT(1) DEFAULT 1,
    `credit` SMALLINT NOT NULL DEFAULT 0,
    `syllabus_pdf` LONGBLOB,
    `faculty_id` INT(11) NOT NULL,
    `year` INT NOT NULL CHECK (`year` BETWEEN 1000 AND 9999),
    `semester` INT NOT NULL,
    `co_threshold` DECIMAL(5, 2) DEFAULT 40.00 CHECK (`co_threshold` >= 0 AND `co_threshold` <= 100),
    `passing_threshold` DECIMAL(5, 2) DEFAULT 60.00 CHECK (`passing_threshold` >= 0 AND `passing_threshold` <= 100),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`course_id`),
    UNIQUE KEY (`course_code`),
    INDEX (`faculty_id`),
    INDEX (`year`, `semester`),
    INDEX `idx_course_dept` (`department_id`),
    FOREIGN KEY (`faculty_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Faculty Assignments (Historical tracking)
CREATE TABLE `course_faculty_assignments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `employee_id` INT(11) NOT NULL,
    `year` INT NOT NULL CHECK (`year` BETWEEN 1000 AND 9999),
    `semester` INT NOT NULL,
    `assignment_type` ENUM('Primary', 'Co-instructor', 'Lab') DEFAULT 'Primary',
    `assigned_date` DATE DEFAULT (CURRENT_DATE),
    `completion_date` DATE NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_course_emp_year_sem_type` (`course_id`, `employee_id`, `year`, `semester`, `assignment_type`),
    INDEX `idx_course_year_sem` (`course_id`, `year`, `semester`),
    INDEX `idx_emp_active` (`employee_id`, `is_active`),
    INDEX `idx_year_sem` (`year`, `semester`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attainment Scale (configurable thresholds per course)
CREATE TABLE `attainment_scale` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `level` SMALLINT NOT NULL CHECK (`level` >= 0 AND `level` <= 10),
    `min_percentage` DECIMAL(5, 2) NOT NULL CHECK (`min_percentage` >= 0 AND `min_percentage` <= 100),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`course_id`, `level`),
    INDEX (`course_id`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CO-PO Mapping Table
CREATE TABLE `co_po_mapping` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `co_name` VARCHAR(5) NOT NULL,  -- CO1, CO2, ... CO6
    `po_name` VARCHAR(5) NOT NULL,  -- PO1..PO12, PSO1..PSO3
    `value` TINYINT NOT NULL DEFAULT 0 CHECK (`value` BETWEEN 0 AND 3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_mapping` (`course_id`, `co_name`, `po_name`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tests
CREATE TABLE `tests` (
    `test_id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `test_name` VARCHAR(100) NOT NULL,
    `test_type` ENUM('Mid Sem', 'End Sem', 'Assignment', 'Quiz') NULL,
    `test_date` DATE NULL,
    `max_marks` DECIMAL(5,2) NULL,
    `weightage` DECIMAL(5,2) NULL,
    `full_marks` INT NOT NULL CHECK (`full_marks` > 0),
    `pass_marks` INT NOT NULL CHECK (`pass_marks` >= 0),
    `question_paper_pdf` LONGBLOB,
    PRIMARY KEY (`test_id`),
    INDEX (`course_id`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions (supports main question, sub-questions, optional)
CREATE TABLE `questions` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `test_id` BIGINT NOT NULL,
    `question_number` SMALLINT NOT NULL CHECK (`question_number` BETWEEN 1 AND 20),
    `sub_question` VARCHAR(10) DEFAULT NULL,  -- a-h or NULL
    `is_optional` BOOLEAN DEFAULT FALSE,  -- for "Attempt either A OR B"
    `co` SMALLINT NOT NULL CHECK (`co` BETWEEN 1 AND 6),
    `max_marks` DECIMAL(5, 2) NOT NULL CHECK (`max_marks` >= 0.5),
    PRIMARY KEY (`question_id`),
    INDEX (`test_id`),
    INDEX (`test_id`, `question_number`),
    UNIQUE KEY (`test_id`, `question_number`, `sub_question`),
    FOREIGN KEY (`test_id`) REFERENCES `tests`(`test_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Enrollment (tracks which students are enrolled in which courses)
CREATE TABLE `enrollments` (
    `enrollment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `enrollment_status` ENUM('Enrolled', 'Dropped', 'Completed') DEFAULT 'Enrolled',
    `enrolled_date` DATE DEFAULT (CURRENT_DATE),
    `student_rollno` VARCHAR(20) NOT NULL,
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`enrollment_id`),
    UNIQUE KEY (`course_id`, `student_rollno`),
    INDEX (`course_id`),
    INDEX (`student_rollno`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_rollno`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Raw Marks (per-question scores, dropped every semester)
CREATE TABLE `raw_marks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `test_id` BIGINT NOT NULL,
    `student_id` VARCHAR(20) NOT NULL,
    `question_id` BIGINT NOT NULL,
    `marks_obtained` DECIMAL(5, 2) NOT NULL CHECK (`marks_obtained` >= 0),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`test_id`, `student_id`, `question_id`),
    INDEX (`test_id`, `student_id`),
    INDEX (`student_id`),
    FOREIGN KEY (`test_id`) REFERENCES `tests`(`test_id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marks (CO-aggregated scores per student per test)
CREATE TABLE `marks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_roll_no` VARCHAR(20) NOT NULL,
    `test_id` BIGINT NOT NULL,
    `CO1` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO1` >= 0),
    `CO2` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO2` >= 0),
    `CO3` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO3` >= 0),
    `CO4` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO4` >= 0),
    `CO5` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO5` >= 0),
    `CO6` DECIMAL(6, 2) DEFAULT 0 CHECK (`CO6` >= 0),
    PRIMARY KEY (`id`),
    UNIQUE KEY (`student_roll_no`, `test_id`),
    INDEX (`test_id`),
    FOREIGN KEY (`student_roll_no`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE,
    FOREIGN KEY (`test_id`) REFERENCES `tests`(`test_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW `v_current_hods` AS
SELECT 
    h.department_id,
    d.department_name,
    d.department_code,
    u.employee_id,
    u.username AS hod_name,
    u.email,
    u.designation,
    h.start_date
FROM `hod_assignments` h
JOIN `users` u ON h.employee_id = u.employee_id
JOIN `departments` d ON h.department_id = d.department_id
WHERE h.is_current = 1;

CREATE OR REPLACE VIEW `v_current_deans` AS
SELECT 
    da.school_id,
    s.school_name,
    u.employee_id,
    u.username AS dean_name,
    u.email,
    u.designation,
    da.start_date
FROM `dean_assignments` da
JOIN `users` u ON da.employee_id = u.employee_id
JOIN `schools` s ON da.school_id = s.school_id
WHERE da.is_current = 1;

-- =============================================
-- SEED DATA
-- =============================================

-- Schools
INSERT INTO `schools` (`school_code`, `school_name`, `description`)
VALUES ('SoE', 'School of Engineering', 'Default school for engineering departments');

-- Departments
INSERT INTO `departments` (`school_id`, `department_name`, `department_code`, `description`)
VALUES 
    (1, 'Computer Science & Engineering', 'CSE', 'Department of Computer Science & Engineering'),
    (1, 'Electronics & Communication Engineering', 'ECE', 'Department of Electronics & Communication Engineering');

-- Users (password: password123, bcrypt hash)
INSERT INTO `users` (`employee_id`, `username`, `email`, `password`, `role`, `department_id`, `designation`)
VALUES 
    (1001, 'Admin One', 'admin_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'admin', NULL, 'System Administrator'),
    (2001, 'HOD CSE', 'hod_cse@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Professor'),
    (2002, 'HOD ECE', 'hod_ece@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Professor'),
    (3001, 'Faculty One', 'faculty_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Associate Professor'),
    (3002, 'Faculty Two', 'faculty_02@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Associate Professor'),
    (3003, 'Faculty Three', 'faculty_03@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Assistant Professor'),
    (3004, 'Faculty Four', 'faculty_04@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Assistant Professor'),
    (3005, 'Faculty Five', 'faculty_05@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Assistant Professor'),
    (3006, 'Faculty Six', 'faculty_06@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Assistant Professor'),
    (4001, 'Staff One', 'staff_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'staff', 1, 'Lab Assistant'),
    (4002, 'Staff Two', 'staff_02@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'staff', 2, 'Lab Assistant');

-- HOD Assignments (employees 2001 and 2002 are current HODs)
INSERT INTO `hod_assignments` (`department_id`, `employee_id`, `start_date`, `is_current`, `appointment_order`)
VALUES 
    (1, 2001, '2024-01-01', 1, 'APT/2024/HOD/CSE/001'),
    (2, 2002, '2024-01-01', 1, 'APT/2024/HOD/ECE/001');

-- Courses (with department_id populated)
INSERT INTO `courses` (`course_id`, `course_code`, `department_id`, `course_name`, `course_type`, `course_level`, `credit`, `syllabus_pdf`, `faculty_id`, `year`, `semester`)
VALUES 
    (1, 'CS101', 1, 'Introduction to Programming', 'Theory', 'Undergraduate', 4, NULL, 3001, 2024, 1),
    (2, 'CS201', 1, 'Data Structures and Algorithms', 'Theory', 'Undergraduate', 4, NULL, 3001, 2024, 1),
    (3, 'CS301', 1, 'Database Management Systems', 'Theory', 'Undergraduate', 3, NULL, 3002, 2024, 1),
    (4, 'CS302', 1, 'Computer Networks', 'Theory', 'Undergraduate', 3, NULL, 3004, 2024, 2);

-- Course Faculty Assignments (populate from course data)
INSERT INTO `course_faculty_assignments` (`course_id`, `employee_id`, `year`, `semester`, `assignment_type`, `assigned_date`, `is_active`)
VALUES 
    (1, 3001, 2024, 1, 'Primary', '2024-01-01', 1),
    (2, 3001, 2024, 1, 'Primary', '2024-01-01', 1),
    (3, 3002, 2024, 1, 'Primary', '2024-01-01', 1),
    (4, 3004, 2024, 2, 'Primary', '2024-01-01', 1);

-- Students (sample data with department_id)
INSERT INTO `students` (`roll_no`, `student_name`, `department_id`, `batch_year`, `student_status`)
VALUES 
    ('2024CSE001', 'Alice Johnson', 1, 2024, 'Active'),
    ('2024CSE002', 'Bob Smith', 1, 2024, 'Active'),
    ('2024CSE003', 'Charlie Brown', 1, 2024, 'Active'),
    ('2024ECE001', 'Diana Prince', 2, 2024, 'Active'),
    ('2024ECE002', 'Eve Wilson', 2, 2024, 'Active');

-- Sample Enrollments
INSERT INTO `enrollments` (`course_id`, `enrollment_status`, `student_rollno`)
VALUES 
    (1, 'Enrolled', '2024CSE001'),
    (1, 'Enrolled', '2024CSE002'),
    (1, 'Enrolled', '2024CSE003'),
    (2, 'Enrolled', '2024CSE001'),
    (2, 'Enrolled', '2024CSE002');

-- Sample Tests
INSERT INTO `tests` (`test_id`, `course_id`, `test_name`, `test_type`, `test_date`, `max_marks`, `weightage`, `full_marks`, `pass_marks`)
VALUES 
    (1, 1, 'Mid Semester Exam', 'Mid Sem', '2024-03-15', 50.00, 30.00, 50, 20),
    (2, 1, 'End Semester Exam', 'End Sem', '2024-05-20', 100.00, 70.00, 100, 40);

-- Sample Questions
INSERT INTO `questions` (`test_id`, `question_number`, `sub_question`, `is_optional`, `co`, `max_marks`)
VALUES 
    (1, 1, NULL, 0, 1, 10.00),
    (1, 2, 'a', 0, 2, 5.00),
    (1, 2, 'b', 0, 2, 5.00),
    (1, 3, NULL, 1, 3, 10.00);

-- =============================================
-- END OF SCHEMA
-- =============================================
