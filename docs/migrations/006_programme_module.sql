-- =============================================
-- NBA DATABASE MIGRATION v5.0 -> v6.0
-- Introduce programme module and student-programme mapping
-- =============================================

USE `nba_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1) Programmes table
CREATE TABLE IF NOT EXISTS `programmes` (
    `programme_id` INT(11) NOT NULL AUTO_INCREMENT,
    `department_id` INT(11) NOT NULL,
    `programme_code` VARCHAR(20) NOT NULL,
    `programme_name` VARCHAR(150) NOT NULL,
    `degree_level` ENUM('UG', 'PG', 'Diploma', 'PhD') NOT NULL DEFAULT 'UG',
    `duration_years` TINYINT NOT NULL DEFAULT 4,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`programme_id`),
    UNIQUE KEY `uk_programme_code` (`programme_code`),
    UNIQUE KEY `uk_programme_name` (`programme_name`),
    INDEX `idx_programme_dept` (`department_id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Programme-Course junction table (many-to-many)
CREATE TABLE IF NOT EXISTS `programme_courses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `programme_id` INT(11) NOT NULL,
    `course_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_programme_course` (`programme_id`, `course_id`),
    INDEX `idx_pc_programme` (`programme_id`),
    INDEX `idx_pc_course` (`course_id`),
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Seed one default programme per department (idempotent)
INSERT INTO `programmes` (`department_id`, `programme_code`, `programme_name`, `degree_level`, `duration_years`)
SELECT d.department_id,
       CONCAT(d.department_code, '-BTECH'),
       CONCAT('B.Tech in ', d.department_name),
       'UG',
       4
FROM `departments` d
WHERE NOT EXISTS (
    SELECT 1 FROM `programmes` p WHERE p.department_id = d.department_id
);

-- 4) Link existing courses to their department's default programme
INSERT IGNORE INTO `programme_courses` (`programme_id`, `course_id`)
SELECT p.programme_id, c.course_id
FROM `courses` c
JOIN `programmes` p ON p.department_id = c.department_id;

-- 5) Add programme_id to students and backfill from department_id
ALTER TABLE `students` ADD COLUMN `programme_id` INT(11) NULL AFTER `student_name`;

UPDATE `students` s
JOIN `programmes` p ON p.department_id = s.department_id
SET s.programme_id = p.programme_id
WHERE s.programme_id IS NULL;

ALTER TABLE `students` MODIFY COLUMN `programme_id` INT(11) NOT NULL;
ALTER TABLE `students` ADD INDEX `idx_students_programme` (`programme_id`);
ALTER TABLE `students` ADD CONSTRAINT `fk_students_programme`
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE;

-- 6) Remove old department FK/column from students
SET @fk_name = (
    SELECT kcu.CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE kcu
    WHERE kcu.TABLE_SCHEMA = DATABASE()
      AND kcu.TABLE_NAME = 'students'
      AND kcu.COLUMN_NAME = 'department_id'
      AND kcu.REFERENCED_TABLE_NAME = 'departments'
    LIMIT 1
);

SET @drop_fk_sql = IF(
    @fk_name IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE `students` DROP FOREIGN KEY `', @fk_name, '`')
);
PREPARE stmt_drop_fk FROM @drop_fk_sql;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

SET @has_idx = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND INDEX_NAME = 'idx_students_dept'
);
SET @drop_idx_sql = IF(@has_idx = 0, 'SELECT 1', 'ALTER TABLE `students` DROP INDEX `idx_students_dept`');
PREPARE stmt_drop_idx FROM @drop_idx_sql;
EXECUTE stmt_drop_idx;
DEALLOCATE PREPARE stmt_drop_idx;

ALTER TABLE `students` DROP COLUMN `department_id`;

SET FOREIGN_KEY_CHECKS = 1;
