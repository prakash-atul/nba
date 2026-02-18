-- =============================================
-- NBA DATABASE SCHEMA - WITH CURSOR PAGINATION + MATERIALIZED STATS
-- Version: 5.0
-- Database: nba_db
-- Purpose: Manage courses, tests, CO-based assessments; keyset cursor pagination support
-- Changes from v4:
--   + department_stats materialized summary table
--   + 6 triggers to keep department_stats in sync
--   + Additional performance indexes on high-traffic columns
--   + dean_assignments seed data added
-- Date: 2026
-- =============================================

USE `nba_db`;

-- =============================================
-- DROP TABLES (Reverse Dependency Order)
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `raw_marks`;
DROP TABLE IF EXISTS `marks`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `tests`;
DROP TABLE IF EXISTS `co_po_mapping`;
DROP TABLE IF EXISTS `attainment_scale`;
DROP TABLE IF EXISTS `course_faculty_assignments`;
DROP TABLE IF EXISTS `course_offerings`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `hod_assignments`;
DROP TABLE IF EXISTS `dean_assignments`;
DROP TABLE IF EXISTS `department_stats`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `schools`;

DROP VIEW IF EXISTS `v_current_hods`;
DROP VIEW IF EXISTS `v_current_deans`;
DROP VIEW IF EXISTS `v_current_offerings`;

-- Drop triggers (safe even if they don't exist yet)
DROP TRIGGER IF EXISTS `trg_users_after_insert`;
DROP TRIGGER IF EXISTS `trg_users_after_delete`;
DROP TRIGGER IF EXISTS `trg_students_after_insert`;
DROP TRIGGER IF EXISTS `trg_students_after_delete`;
DROP TRIGGER IF EXISTS `trg_courses_after_insert`;
DROP TRIGGER IF EXISTS `trg_courses_after_delete`;

SET FOREIGN_KEY_CHECKS = 1;

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
    INDEX `idx_school` (`school_id`),
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`school_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users (Admin, Faculty, Staff)
-- Note: HOD and Dean roles are managed via assignment tables
CREATE TABLE `users` (
    `employee_id` INT(11) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `email` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'faculty', 'staff') NOT NULL,
    `department_id` INT(11) NULL,
    `designation` VARCHAR(50) NULL,
    `phone` VARCHAR(15) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`employee_id`),
    UNIQUE KEY (`email`),
    INDEX `idx_dept` (`department_id`),
    -- v5: composite indexes for role-filtered pagination
    INDEX `idx_role_dept` (`role`, `department_id`),
    INDEX `idx_dept_emp` (`department_id`, `employee_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Department Stats (materialized summary — kept in sync by triggers)
-- Populated once by INSERT ... SELECT after seed data; updated by triggers from that point on.
CREATE TABLE `department_stats` (
    `department_id` INT(11) NOT NULL,
    `faculty_count` INT NOT NULL DEFAULT 0,
    `student_count` INT NOT NULL DEFAULT 0,
    `course_count` INT NOT NULL DEFAULT 0,
    `active_offerings_count` INT NOT NULL DEFAULT 0,
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`department_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE CASCADE
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
    -- v5: additional indexes for pagination filters
    INDEX `idx_dept_roll` (`department_id`, `roll_no`),
    INDEX `idx_batch` (`batch_year`),
    INDEX `idx_status` (`student_status`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- COURSE + OFFERING TABLES
-- =============================================

-- Courses (TEMPLATE — no session-specific data)
CREATE TABLE `courses` (
    `course_id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_code` VARCHAR(20) NOT NULL,
    `department_id` INT(11) NULL,
    `course_name` VARCHAR(255) NOT NULL,
    `course_type` ENUM('Theory', 'Lab', 'Project', 'Seminar') DEFAULT 'Theory',
    `course_level` ENUM('Undergraduate', 'Postgraduate') DEFAULT 'Undergraduate',
    `is_active` TINYINT(1) DEFAULT 1,
    `credit` SMALLINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`course_id`),
    UNIQUE KEY (`course_code`),
    INDEX `idx_course_dept` (`department_id`),
    -- v5: additional indexes for filtered pagination
    INDEX `idx_dept_course` (`department_id`, `course_id`),
    INDEX `idx_type` (`course_type`),
    INDEX `idx_level` (`course_level`),
    INDEX `idx_active` (`is_active`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Offerings (SESSION INSTANCE of a course — year/semester specific)
CREATE TABLE `course_offerings` (
    `offering_id` BIGINT NOT NULL AUTO_INCREMENT,
    `course_id` BIGINT NOT NULL,
    `year` INT NOT NULL CHECK (`year` BETWEEN 1000 AND 9999),
    `semester` INT NOT NULL,
    `co_threshold` DECIMAL(5, 2) DEFAULT 40.00 CHECK (`co_threshold` >= 0 AND `co_threshold` <= 100),
    `passing_threshold` DECIMAL(5, 2) DEFAULT 60.00 CHECK (`passing_threshold` >= 0 AND `passing_threshold` <= 100),
    `syllabus_pdf` LONGBLOB,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`offering_id`),
    UNIQUE KEY `uk_course_year_sem` (`course_id`, `year`, `semester`),
    INDEX (`course_id`),
    -- v5: composite index for year-desc pagination typical in dean/hod views
    INDEX `idx_year_sem_course` (`year` DESC, `semester` DESC, `course_id`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Faculty Assignments
CREATE TABLE `course_faculty_assignments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NOT NULL,
    `employee_id` INT(11) NOT NULL,
    `assignment_type` ENUM('Primary', 'Co-instructor', 'Lab') DEFAULT 'Primary',
    `assigned_date` DATE DEFAULT (CURRENT_DATE),
    `completion_date` DATE NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_offering_emp_type` (`offering_id`, `employee_id`, `assignment_type`),
    INDEX `idx_offering` (`offering_id`),
    INDEX `idx_emp_active` (`employee_id`, `is_active`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`employee_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ASSESSMENT TABLES
-- =============================================

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
    `co_name` VARCHAR(5) NOT NULL,
    `po_name` VARCHAR(5) NOT NULL,
    `value` TINYINT NOT NULL DEFAULT 0 CHECK (`value` BETWEEN 0 AND 3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_mapping` (`course_id`, `co_name`, `po_name`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tests (references offering_id)
CREATE TABLE `tests` (
    `test_id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NOT NULL,
    `test_name` VARCHAR(100) NOT NULL,
    `test_type` ENUM('Mid Sem', 'End Sem', 'Assignment', 'Quiz') NULL,
    `test_date` DATE NULL,
    `max_marks` DECIMAL(5,2) NULL,
    `weightage` DECIMAL(5,2) NULL,
    `full_marks` INT NOT NULL CHECK (`full_marks` > 0),
    `pass_marks` INT NOT NULL CHECK (`pass_marks` >= 0),
    `question_paper_pdf` LONGBLOB,
    PRIMARY KEY (`test_id`),
    -- v5: replace bare INDEX(offering_id) with more specific composite index
    INDEX `idx_offering_test` (`offering_id`, `test_id`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions
CREATE TABLE `questions` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `test_id` BIGINT NOT NULL,
    `question_number` SMALLINT NOT NULL CHECK (`question_number` BETWEEN 1 AND 20),
    `sub_question` VARCHAR(10) DEFAULT NULL,
    `is_optional` BOOLEAN DEFAULT FALSE,
    `co` SMALLINT NOT NULL CHECK (`co` BETWEEN 1 AND 6),
    `max_marks` DECIMAL(5, 2) NOT NULL CHECK (`max_marks` >= 0.5),
    PRIMARY KEY (`question_id`),
    INDEX (`test_id`),
    INDEX (`test_id`, `question_number`),
    UNIQUE KEY (`test_id`, `question_number`, `sub_question`),
    FOREIGN KEY (`test_id`) REFERENCES `tests`(`test_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Enrollment
CREATE TABLE `enrollments` (
    `enrollment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NOT NULL,
    `enrollment_status` ENUM('Enrolled', 'Dropped', 'Completed') DEFAULT 'Enrolled',
    `enrolled_date` DATE DEFAULT (CURRENT_DATE),
    `student_rollno` VARCHAR(20) NOT NULL,
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`enrollment_id`),
    UNIQUE KEY (`offering_id`, `student_rollno`),
    INDEX (`offering_id`),
    INDEX (`student_rollno`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_rollno`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Raw Marks (per-question scores)
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
    -- v5: composite index for test+student lookups
    INDEX `idx_test_roll` (`test_id`, `student_roll_no`),
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

CREATE OR REPLACE VIEW `v_current_offerings` AS
SELECT 
    co.offering_id,
    co.course_id,
    c.course_code,
    c.course_name,
    c.credit,
    c.course_type,
    c.course_level,
    c.department_id,
    d.department_name,
    d.department_code,
    co.year,
    co.semester,
    co.co_threshold,
    co.passing_threshold,
    cfa.employee_id AS primary_faculty_id,
    u.username AS primary_faculty_name
FROM `course_offerings` co
INNER JOIN `courses` c ON co.course_id = c.course_id
LEFT JOIN `departments` d ON c.department_id = d.department_id
LEFT JOIN `course_faculty_assignments` cfa ON co.offering_id = cfa.offering_id 
    AND cfa.assignment_type = 'Primary' AND cfa.is_active = 1
LEFT JOIN `users` u ON cfa.employee_id = u.employee_id;

-- =============================================
-- TRIGGERS (department_stats maintenance)
-- =============================================

DELIMITER $$

-- faculty_count: increment when a faculty/staff user is inserted
CREATE TRIGGER `trg_users_after_insert`
AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
    IF NEW.role IN ('faculty', 'staff') AND NEW.department_id IS NOT NULL THEN
        INSERT INTO `department_stats` (`department_id`, `faculty_count`, `student_count`, `course_count`, `active_offerings_count`)
            VALUES (NEW.department_id, 1, 0, 0, 0)
        ON DUPLICATE KEY UPDATE
            `faculty_count` = `faculty_count` + 1,
            `last_updated` = CURRENT_TIMESTAMP;
    END IF;
END$$

-- faculty_count: decrement when a faculty/staff user is deleted
CREATE TRIGGER `trg_users_after_delete`
AFTER DELETE ON `users`
FOR EACH ROW
BEGIN
    IF OLD.role IN ('faculty', 'staff') AND OLD.department_id IS NOT NULL THEN
        UPDATE `department_stats`
        SET `faculty_count` = GREATEST(0, `faculty_count` - 1),
            `last_updated` = CURRENT_TIMESTAMP
        WHERE `department_id` = OLD.department_id;
    END IF;
END$$

-- student_count: increment on new enrollment
CREATE TRIGGER `trg_students_after_insert`
AFTER INSERT ON `students`
FOR EACH ROW
BEGIN
    INSERT INTO `department_stats` (`department_id`, `faculty_count`, `student_count`, `course_count`, `active_offerings_count`)
        VALUES (NEW.department_id, 0, 1, 0, 0)
    ON DUPLICATE KEY UPDATE
        `student_count` = `student_count` + 1,
        `last_updated` = CURRENT_TIMESTAMP;
END$$

-- student_count: decrement on student delete
CREATE TRIGGER `trg_students_after_delete`
AFTER DELETE ON `students`
FOR EACH ROW
BEGIN
    UPDATE `department_stats`
    SET `student_count` = GREATEST(0, `student_count` - 1),
        `last_updated` = CURRENT_TIMESTAMP
    WHERE `department_id` = OLD.department_id;
END$$

-- course_count: increment when a course is added for a department
CREATE TRIGGER `trg_courses_after_insert`
AFTER INSERT ON `courses`
FOR EACH ROW
BEGIN
    IF NEW.department_id IS NOT NULL THEN
        INSERT INTO `department_stats` (`department_id`, `faculty_count`, `student_count`, `course_count`, `active_offerings_count`)
            VALUES (NEW.department_id, 0, 0, 1, 0)
        ON DUPLICATE KEY UPDATE
            `course_count` = `course_count` + 1,
            `last_updated` = CURRENT_TIMESTAMP;
    END IF;
END$$

-- course_count: decrement when a course is deleted
CREATE TRIGGER `trg_courses_after_delete`
AFTER DELETE ON `courses`
FOR EACH ROW
BEGIN
    IF OLD.department_id IS NOT NULL THEN
        UPDATE `department_stats`
        SET `course_count` = GREATEST(0, `course_count` - 1),
            `last_updated` = CURRENT_TIMESTAMP
        WHERE `department_id` = OLD.department_id;
    END IF;
END$$

DELIMITER ;

-- =============================================
-- SEED DATA
-- =============================================

-- Schools
INSERT INTO `schools` (`school_id`, `school_code`, `school_name`, `description`)
VALUES (1, 'SoE', 'School of Engineering', 'Default school for engineering departments');

-- Departments
INSERT INTO `departments` (`department_id`, `school_id`, `department_name`, `department_code`, `description`)
VALUES 
    (1, 1, 'Computer Science & Engineering', 'CSE', 'Department of Computer Science & Engineering'),
    (2, 1, 'Electronics & Communication Engineering', 'ECE', 'Department of Electronics & Communication Engineering');

-- Users (password: password123, bcrypt hash)
INSERT INTO `users` (`employee_id`, `username`, `email`, `password_hash`, `role`, `department_id`, `designation`)
VALUES 
    (1001, 'Admin One', 'admin_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'admin', NULL, 'System Administrator'),
    (2001, 'HOD CSE', 'hod_cse@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Professor'),
    (2002, 'HOD ECE', 'hod_ece@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Professor'),
    (2010, 'Dean SoE', 'dean_soe@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Professor'),
    (3001, 'Faculty One', 'faculty_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Associate Professor'),
    (3002, 'Faculty Two', 'faculty_02@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Associate Professor'),
    (3003, 'Faculty Three', 'faculty_03@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Assistant Professor'),
    (3004, 'Faculty Four', 'faculty_04@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 1, 'Assistant Professor'),
    (3005, 'Faculty Five', 'faculty_05@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Assistant Professor'),
    (3006, 'Faculty Six', 'faculty_06@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'faculty', 2, 'Assistant Professor'),
    (4001, 'Staff One', 'staff_01@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'staff', 1, 'Lab Assistant'),
    (4002, 'Staff Two', 'staff_02@tezu.ac.in', '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe', 'staff', 2, 'Lab Assistant');

-- HOD Assignments
INSERT INTO `hod_assignments` (`department_id`, `employee_id`, `start_date`, `is_current`, `appointment_order`)
VALUES 
    (1, 2001, '2024-01-01', 1, 'APT/2024/HOD/CSE/001'),
    (2, 2002, '2024-01-01', 1, 'APT/2024/HOD/ECE/001');

-- Dean Assignments
INSERT INTO `dean_assignments` (`school_id`, `employee_id`, `start_date`, `is_current`, `appointment_order`)
VALUES 
    (1, 2010, '2024-01-01', 1, 'APT/2024/DEAN/SOE/001');

-- Courses (TEMPLATES)
INSERT INTO `courses` (`course_id`, `course_code`, `department_id`, `course_name`, `course_type`, `course_level`, `credit`)
VALUES 
    (1, 'CS101', 1, 'Introduction to Programming', 'Theory', 'Undergraduate', 4),
    (2, 'CS201', 1, 'Data Structures and Algorithms', 'Theory', 'Undergraduate', 4),
    (3, 'CS301', 1, 'Database Management Systems', 'Theory', 'Undergraduate', 3),
    (4, 'CS302', 1, 'Computer Networks', 'Theory', 'Undergraduate', 3),
    (5, 'CS401', 1, 'Operating Systems', 'Theory', 'Undergraduate', 4),
    (6, 'CS191', 1, 'Programming Lab', 'Lab', 'Undergraduate', 2),
    (7, 'EC101', 2, 'Digital Electronics', 'Theory', 'Undergraduate', 4),
    (8, 'EC201', 2, 'Signals and Systems', 'Theory', 'Undergraduate', 4);

-- Course Offerings (session instances)
INSERT INTO `course_offerings` (`offering_id`, `course_id`, `year`, `semester`, `co_threshold`, `passing_threshold`)
VALUES 
    (1, 1, 2024, 1, 40.00, 60.00),
    (2, 2, 2024, 1, 40.00, 60.00),
    (3, 3, 2024, 1, 40.00, 60.00),
    (4, 6, 2024, 1, 40.00, 60.00),
    (5, 4, 2024, 2, 40.00, 60.00),
    (6, 5, 2024, 2, 40.00, 60.00),
    (7, 7, 2024, 2, 40.00, 60.00),
    (8, 1, 2025, 1, 40.00, 60.00),
    (9, 8, 2025, 1, 40.00, 60.00);

-- Course Faculty Assignments
INSERT INTO `course_faculty_assignments` (`offering_id`, `employee_id`, `assignment_type`, `assigned_date`, `is_active`)
VALUES 
    (1, 3001, 'Primary', '2024-01-01', 1),
    (2, 3001, 'Primary', '2024-01-01', 1),
    (3, 3002, 'Primary', '2024-01-01', 1),
    (4, 3003, 'Primary', '2024-01-01', 1),
    (4, 3004, 'Lab', '2024-01-01', 1),
    (5, 3004, 'Primary', '2024-07-01', 1),
    (6, 3002, 'Primary', '2024-07-01', 1),
    (7, 3005, 'Primary', '2024-07-01', 1),
    (8, 3003, 'Primary', '2025-01-01', 1),
    (9, 3006, 'Primary', '2025-01-01', 1);

-- Students
INSERT INTO `students` (`roll_no`, `student_name`, `department_id`, `batch_year`, `student_status`, `email`)
VALUES 
    ('2024CSE001', 'Alice Johnson', 1, 2024, 'Active', 'alice@student.tezu.ac.in'),
    ('2024CSE002', 'Bob Smith', 1, 2024, 'Active', 'bob@student.tezu.ac.in'),
    ('2024CSE003', 'Charlie Brown', 1, 2024, 'Active', 'charlie@student.tezu.ac.in'),
    ('2024CSE004', 'David Lee', 1, 2024, 'Active', 'david@student.tezu.ac.in'),
    ('2024CSE005', 'Emma Watson', 1, 2024, 'Active', 'emma@student.tezu.ac.in'),
    ('2024CSE006', 'Frank Miller', 1, 2024, 'Active', 'frank@student.tezu.ac.in'),
    ('2024CSE007', 'Grace Park', 1, 2024, 'Active', 'grace@student.tezu.ac.in'),
    ('2024CSE008', 'Henry Chen', 1, 2024, 'Active', 'henry@student.tezu.ac.in'),
    ('2024CSE009', 'Iris Patel', 1, 2024, 'Active', 'iris@student.tezu.ac.in'),
    ('2024CSE010', 'Jack Wilson', 1, 2024, 'Active', 'jack@student.tezu.ac.in'),
    ('2024ECE001', 'Diana Prince', 2, 2024, 'Active', 'diana@student.tezu.ac.in'),
    ('2024ECE002', 'Eve Wilson', 2, 2024, 'Active', 'eve@student.tezu.ac.in'),
    ('2024ECE003', 'Kevin Hart', 2, 2024, 'Active', 'kevin@student.tezu.ac.in'),
    ('2024ECE004', 'Luna Davis', 2, 2024, 'Active', 'luna@student.tezu.ac.in'),
    ('2024ECE005', 'Mike Ross', 2, 2024, 'Active', 'mike@student.tezu.ac.in'),
    ('2025CSE001', 'Nora Singh', 1, 2025, 'Active', 'nora@student.tezu.ac.in'),
    ('2025CSE002', 'Oscar Gupta', 1, 2025, 'Active', 'oscar@student.tezu.ac.in'),
    ('2025CSE003', 'Paula Sharma', 1, 2025, 'Active', 'paula@student.tezu.ac.in');

-- Enrollments
INSERT INTO `enrollments` (`offering_id`, `enrollment_status`, `student_rollno`)
VALUES 
    (1, 'Enrolled', '2024CSE001'), (1, 'Enrolled', '2024CSE002'), (1, 'Enrolled', '2024CSE003'),
    (1, 'Enrolled', '2024CSE004'), (1, 'Enrolled', '2024CSE005'), (1, 'Enrolled', '2024CSE006'),
    (1, 'Enrolled', '2024CSE007'), (1, 'Enrolled', '2024CSE008'), (1, 'Enrolled', '2024CSE009'),
    (1, 'Enrolled', '2024CSE010'),
    (2, 'Enrolled', '2024CSE001'), (2, 'Enrolled', '2024CSE002'), (2, 'Enrolled', '2024CSE003'),
    (2, 'Enrolled', '2024CSE004'), (2, 'Enrolled', '2024CSE005'), (2, 'Enrolled', '2024CSE006'),
    (2, 'Enrolled', '2024CSE007'), (2, 'Enrolled', '2024CSE008'), (2, 'Enrolled', '2024CSE009'),
    (2, 'Enrolled', '2024CSE010'),
    (3, 'Enrolled', '2024CSE001'), (3, 'Enrolled', '2024CSE002'), (3, 'Enrolled', '2024CSE003'),
    (3, 'Enrolled', '2024CSE004'), (3, 'Enrolled', '2024CSE005'),
    (4, 'Enrolled', '2024CSE001'), (4, 'Enrolled', '2024CSE002'), (4, 'Enrolled', '2024CSE003'),
    (5, 'Enrolled', '2024CSE001'), (5, 'Enrolled', '2024CSE002'), (5, 'Enrolled', '2024CSE003'),
    (5, 'Enrolled', '2024CSE004'), (5, 'Enrolled', '2024CSE005'),
    (7, 'Enrolled', '2024ECE001'), (7, 'Enrolled', '2024ECE002'), (7, 'Enrolled', '2024ECE003'),
    (7, 'Enrolled', '2024ECE004'), (7, 'Enrolled', '2024ECE005'),
    (8, 'Enrolled', '2025CSE001'), (8, 'Enrolled', '2025CSE002'), (8, 'Enrolled', '2025CSE003');

-- Tests
INSERT INTO `tests` (`test_id`, `offering_id`, `test_name`, `test_type`, `test_date`, `max_marks`, `weightage`, `full_marks`, `pass_marks`)
VALUES 
    (1, 1, 'Mid Semester Exam', 'Mid Sem', '2024-03-15', 50.00, 30.00, 50, 20),
    (2, 1, 'End Semester Exam', 'End Sem', '2024-05-20', 100.00, 70.00, 100, 40),
    (3, 1, 'Assignment 1', 'Assignment', '2024-02-15', 20.00, NULL, 20, 8),
    (4, 2, 'Mid Semester Exam', 'Mid Sem', '2024-03-16', 50.00, 30.00, 50, 20),
    (5, 2, 'Quiz 1', 'Quiz', '2024-02-20', 10.00, NULL, 10, 4),
    (6, 3, 'Mid Semester Exam', 'Mid Sem', '2024-03-17', 50.00, 30.00, 50, 20),
    (7, 5, 'Mid Semester Exam', 'Mid Sem', '2024-09-15', 50.00, 30.00, 50, 20),
    (8, 7, 'Mid Semester Exam', 'Mid Sem', '2024-09-16', 50.00, 30.00, 50, 20);

-- Questions
INSERT INTO `questions` (`test_id`, `question_number`, `sub_question`, `is_optional`, `co`, `max_marks`)
VALUES 
    (1, 1, NULL, 0, 1, 10.00),
    (1, 2, 'a', 0, 2, 5.00),
    (1, 2, 'b', 0, 2, 5.00),
    (1, 3, NULL, 1, 3, 10.00),
    (1, 4, NULL, 1, 3, 10.00),
    (1, 5, NULL, 0, 4, 10.00),
    (2, 1, 'a', 0, 1, 10.00),
    (2, 1, 'b', 0, 1, 10.00),
    (2, 2, NULL, 0, 2, 15.00),
    (2, 3, NULL, 0, 3, 15.00),
    (2, 4, 'a', 0, 4, 10.00),
    (2, 4, 'b', 0, 5, 10.00),
    (2, 5, NULL, 1, 5, 15.00),
    (2, 6, NULL, 1, 6, 15.00),
    (3, 1, NULL, 0, 1, 10.00),
    (3, 2, NULL, 0, 2, 10.00),
    (4, 1, NULL, 0, 1, 10.00),
    (4, 2, 'a', 0, 2, 5.00),
    (4, 2, 'b', 0, 2, 5.00),
    (4, 3, NULL, 0, 3, 10.00),
    (4, 4, NULL, 1, 4, 10.00),
    (4, 5, NULL, 1, 4, 10.00),
    (5, 1, NULL, 0, 1, 5.00),
    (5, 2, NULL, 0, 2, 5.00),
    (6, 1, NULL, 0, 1, 10.00),
    (6, 2, 'a', 0, 2, 5.00),
    (6, 2, 'b', 0, 2, 5.00),
    (6, 3, NULL, 0, 3, 15.00),
    (6, 4, NULL, 0, 4, 15.00);

-- Raw Marks
INSERT INTO `raw_marks` (`test_id`, `student_id`, `question_id`, `marks_obtained`)
VALUES 
    (1, '2024CSE001', 1, 8.50), (1, '2024CSE001', 2, 4.00), (1, '2024CSE001', 3, 4.50),
    (1, '2024CSE001', 4, 9.00), (1, '2024CSE001', 6, 8.00),
    (1, '2024CSE002', 1, 7.00), (1, '2024CSE002', 2, 3.50), (1, '2024CSE002', 3, 4.00),
    (1, '2024CSE002', 5, 8.50), (1, '2024CSE002', 6, 7.50),
    (1, '2024CSE003', 1, 9.00), (1, '2024CSE003', 2, 5.00), (1, '2024CSE003', 3, 5.00),
    (1, '2024CSE003', 4, 10.00), (1, '2024CSE003', 6, 9.50),
    (1, '2024CSE004', 1, 6.00), (1, '2024CSE004', 2, 3.00), (1, '2024CSE004', 3, 2.50),
    (1, '2024CSE004', 4, 7.00), (1, '2024CSE004', 6, 5.50),
    (1, '2024CSE005', 1, 10.00), (1, '2024CSE005', 2, 5.00), (1, '2024CSE005', 3, 4.50),
    (1, '2024CSE005', 5, 9.50), (1, '2024CSE005', 6, 10.00);

-- CO-PO Mappings
INSERT INTO `co_po_mapping` (`course_id`, `co_name`, `po_name`, `value`)
VALUES 
    (1, 'CO1', 'PO1', 3), (1, 'CO1', 'PO2', 2), (1, 'CO1', 'PO5', 1),
    (1, 'CO2', 'PO1', 2), (1, 'CO2', 'PO2', 3), (1, 'CO2', 'PO3', 1),
    (1, 'CO3', 'PO2', 2), (1, 'CO3', 'PO3', 3), (1, 'CO3', 'PO5', 2),
    (1, 'CO4', 'PO1', 1), (1, 'CO4', 'PO3', 2), (1, 'CO4', 'PO5', 3),
    (2, 'CO1', 'PO1', 3), (2, 'CO1', 'PO2', 2),
    (2, 'CO2', 'PO1', 2), (2, 'CO2', 'PO2', 3), (2, 'CO2', 'PO3', 2),
    (2, 'CO3', 'PO2', 2), (2, 'CO3', 'PO3', 3),
    (2, 'CO4', 'PO3', 2), (2, 'CO4', 'PO5', 2),
    (3, 'CO1', 'PO1', 3), (3, 'CO1', 'PO2', 1),
    (3, 'CO2', 'PO1', 2), (3, 'CO2', 'PO2', 3), (3, 'CO2', 'PO3', 1),
    (3, 'CO3', 'PO2', 2), (3, 'CO3', 'PO3', 3), (3, 'CO3', 'PO5', 1),
    (3, 'CO4', 'PO3', 2), (3, 'CO4', 'PO5', 3);

-- Attainment Scale
INSERT INTO `attainment_scale` (`course_id`, `level`, `min_percentage`)
VALUES 
    (1, 1, 40.00), (1, 2, 60.00), (1, 3, 80.00),
    (2, 1, 40.00), (2, 2, 60.00), (2, 3, 80.00),
    (3, 1, 40.00), (3, 2, 60.00), (3, 3, 80.00);

-- =============================================
-- POPULATE department_stats (initial calculation)
-- Run after all seed INSERTs so triggers don't double-count
-- =============================================

INSERT INTO `department_stats` (`department_id`, `faculty_count`, `student_count`, `course_count`, `active_offerings_count`)
SELECT
    d.department_id,
    COALESCE(u_cnt.cnt, 0) AS faculty_count,
    COALESCE(s_cnt.cnt, 0) AS student_count,
    COALESCE(c_cnt.cnt, 0) AS course_count,
    COALESCE(o_cnt.cnt, 0) AS active_offerings_count
FROM `departments` d
LEFT JOIN (
    SELECT department_id, COUNT(*) AS cnt
    FROM `users`
    WHERE role IN ('faculty', 'staff')
    GROUP BY department_id
) u_cnt ON d.department_id = u_cnt.department_id
LEFT JOIN (
    SELECT department_id, COUNT(*) AS cnt
    FROM `students`
    GROUP BY department_id
) s_cnt ON d.department_id = s_cnt.department_id
LEFT JOIN (
    SELECT department_id, COUNT(*) AS cnt
    FROM `courses`
    GROUP BY department_id
) c_cnt ON d.department_id = c_cnt.department_id
LEFT JOIN (
    SELECT c.department_id, COUNT(*) AS cnt
    FROM `course_offerings` co
    JOIN `courses` c ON co.course_id = c.course_id
    GROUP BY c.department_id
) o_cnt ON d.department_id = o_cnt.department_id
ON DUPLICATE KEY UPDATE
    `faculty_count`           = VALUES(`faculty_count`),
    `student_count`           = VALUES(`student_count`),
    `course_count`            = VALUES(`course_count`),
    `active_offerings_count`  = VALUES(`active_offerings_count`),
    `last_updated`            = CURRENT_TIMESTAMP;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 'schools' AS `table`, COUNT(*) AS `rows` FROM `schools`
UNION ALL SELECT 'departments',         COUNT(*) FROM `departments`
UNION ALL SELECT 'department_stats',    COUNT(*) FROM `department_stats`
UNION ALL SELECT 'users',               COUNT(*) FROM `users`
UNION ALL SELECT 'hod_assignments',     COUNT(*) FROM `hod_assignments`
UNION ALL SELECT 'dean_assignments',    COUNT(*) FROM `dean_assignments`
UNION ALL SELECT 'students',            COUNT(*) FROM `students`
UNION ALL SELECT 'courses',             COUNT(*) FROM `courses`
UNION ALL SELECT 'course_offerings',    COUNT(*) FROM `course_offerings`
UNION ALL SELECT 'faculty_assignments', COUNT(*) FROM `course_faculty_assignments`
UNION ALL SELECT 'enrollments',         COUNT(*) FROM `enrollments`
UNION ALL SELECT 'tests',               COUNT(*) FROM `tests`
UNION ALL SELECT 'questions',           COUNT(*) FROM `questions`
UNION ALL SELECT 'raw_marks',           COUNT(*) FROM `raw_marks`
UNION ALL SELECT 'co_po_mapping',       COUNT(*) FROM `co_po_mapping`
UNION ALL SELECT 'attainment_scale',    COUNT(*) FROM `attainment_scale`;

-- =============================================
-- END OF SCHEMA v5.0
-- =============================================
