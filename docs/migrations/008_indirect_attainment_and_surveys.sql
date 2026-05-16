-- =============================================
-- NBA DATABASE MIGRATION v7.0 -> v8.0
-- Indirect attainment, surveys, action plans
-- =============================================

USE `nba_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. EXTEND EXISTING SNAPSHOT TABLES
-- =============================================

-- Add indirect/final attainment columns to offering_co_attainment
ALTER TABLE `offering_co_attainment`
    ADD COLUMN `indirect_attainment_percentage` DECIMAL(5,2) DEFAULT NULL AFTER `attainment_level`,
    ADD COLUMN `indirect_attainment_level` DECIMAL(5,2) DEFAULT NULL AFTER `indirect_attainment_percentage`,
    ADD COLUMN `final_attainment_percentage` DECIMAL(5,2) DEFAULT NULL AFTER `indirect_attainment_level`,
    ADD COLUMN `final_attainment_level` DECIMAL(5,2) DEFAULT NULL AFTER `final_attainment_percentage`;

-- Add indirect/final attainment columns to offering_po_attainment
ALTER TABLE `offering_po_attainment`
    ADD COLUMN `indirect_attainment_value` DECIMAL(5,2) DEFAULT NULL AFTER `attainment_value`,
    ADD COLUMN `final_attainment_value` DECIMAL(5,2) DEFAULT NULL AFTER `indirect_attainment_value`;

-- Add configurable weightage per offering (default 80/20 split)
ALTER TABLE `course_offerings`
    ADD COLUMN `direct_weightage` DECIMAL(5,2) DEFAULT 80.00 CHECK (`direct_weightage` >= 0 AND `direct_weightage` <= 100),
    ADD COLUMN `indirect_weightage` DECIMAL(5,2) DEFAULT 20.00 CHECK (`indirect_weightage` >= 0 AND `indirect_weightage` <= 100);

-- =============================================
-- 2. COURSE EXIT SURVEY TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `course_exit_survey_responses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NOT NULL,
    `student_rollno` VARCHAR(20) NOT NULL,
    `co_number` TINYINT NOT NULL CHECK (`co_number` BETWEEN 1 AND 6),
    `likert_rating` TINYINT NOT NULL CHECK (`likert_rating` BETWEEN 1 AND 5),
    `imported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_offering_student_co` (`offering_id`, `student_rollno`, `co_number`),
    INDEX `idx_cesr_offering` (`offering_id`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_rollno`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. STAKEHOLDER SURVEY RESPONSES
-- =============================================

CREATE TABLE IF NOT EXISTS `stakeholder_survey_responses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `programme_id` INT(11) NOT NULL,
    `stakeholder_type` ENUM('Alumni','Employer','Graduate Exit','Parent','Academic Peer') NOT NULL,
    `batch_year` INT NOT NULL,
    `po_name` VARCHAR(5) NOT NULL,
    `likert_rating` TINYINT NOT NULL CHECK (`likert_rating` BETWEEN 1 AND 5),
    `respondent_identifier` VARCHAR(255) NULL,
    `imported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ssr_programme` (`programme_id`),
    INDEX `idx_ssr_batch` (`batch_year`),
    INDEX `idx_ssr_type` (`stakeholder_type`),
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. PROGRAMME BATCH ATTAINMENTS (final blended)
-- =============================================

CREATE TABLE IF NOT EXISTS `programme_batch_attainments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `programme_id` INT(11) NOT NULL,
    `batch_year` INT NOT NULL,
    `po_name` VARCHAR(5) NOT NULL,
    `direct_attainment` DECIMAL(5,2) DEFAULT 0.00,
    `indirect_attainment` DECIMAL(5,2) DEFAULT 0.00,
    `final_attainment` DECIMAL(5,2) DEFAULT 0.00,
    `target` DECIMAL(5,2) DEFAULT 0.00,
    `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_programme_batch_po` (`programme_id`, `batch_year`, `po_name`),
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. ACTION PLANS (continuous improvement)
-- =============================================

CREATE TABLE IF NOT EXISTS `action_plans` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NULL,
    `programme_id` INT(11) NULL,
    `batch_year` INT NULL,
    `po_name` VARCHAR(5) NULL,
    `gap_description` TEXT NOT NULL,
    `action_text` TEXT NOT NULL,
    `responsible_person` VARCHAR(255) NULL,
    `target_date` DATE NULL,
    `status` ENUM('Open', 'In Progress', 'Completed') DEFAULT 'Open',
    `created_by` INT(11) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ap_offering` (`offering_id`),
    INDEX `idx_ap_programme` (`programme_id`),
    INDEX `idx_ap_status` (`status`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE,
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
