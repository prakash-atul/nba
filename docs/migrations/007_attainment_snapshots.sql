-- =============================================
-- NBA DATABASE MIGRATION v6.0 -> v7.0
-- Attainment snapshots for conclude/reopen workflow
-- =============================================

USE `nba_db`;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `offering_co_attainment` (
    `offering_id` BIGINT NOT NULL,
    `co_number` TINYINT NOT NULL CHECK (`co_number` BETWEEN 1 AND 6),
    `attainment_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `attainment_level` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`offering_id`, `co_number`),
    INDEX `idx_oca_offering` (`offering_id`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `offering_po_attainment` (
    `offering_id` BIGINT NOT NULL,
    `po_name` VARCHAR(5) NOT NULL,
    `attainment_value` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`offering_id`, `po_name`),
    INDEX `idx_opa_offering` (`offering_id`),
    INDEX `idx_opa_po_name` (`po_name`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
