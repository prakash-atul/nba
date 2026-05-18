-- Migration: 011_survey_question_structure.sql
-- Description: Introduces test-like question structures for surveys (Course + Stakeholder) with chronological mapping and mapping weights.

DROP TABLE IF EXISTS `course_survey_responses`;
DROP TABLE IF EXISTS `course_survey_questions`;
DROP TABLE IF EXISTS `course_surveys`;

DROP TABLE IF EXISTS `stakeholder_survey_responses_v2`;
DROP TABLE IF EXISTS `stakeholder_survey_questions`;
DROP TABLE IF EXISTS `stakeholder_surveys`;

-- 1. Course Surveys
CREATE TABLE `course_surveys` (
    `survey_id` BIGINT NOT NULL AUTO_INCREMENT,
    `offering_id` BIGINT NOT NULL,
    `title` VARCHAR(255) DEFAULT 'Course Exit Survey',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`survey_id`),
    FOREIGN KEY (`offering_id`) REFERENCES `course_offerings`(`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Course Survey Questions
CREATE TABLE `course_survey_questions` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `survey_id` BIGINT NOT NULL,
    `question_number` SMALLINT NOT NULL,
    `question_text` TEXT NOT NULL,
    `co_number` TINYINT NOT NULL CHECK (`co_number` BETWEEN 1 AND 6),
    `mapping_weight` DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (`mapping_weight` BETWEEN 0.00 AND 1.00),
    PRIMARY KEY (`question_id`),
    UNIQUE KEY `uk_survey_qnum` (`survey_id`, `question_number`),
    FOREIGN KEY (`survey_id`) REFERENCES `course_surveys`(`survey_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Course Survey Responses
CREATE TABLE `course_survey_responses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `survey_id` BIGINT NOT NULL,
    `student_rollno` VARCHAR(20) NOT NULL,
    `question_id` BIGINT NOT NULL,
    `likert_rating` TINYINT NOT NULL CHECK (`likert_rating` BETWEEN 1 AND 5),
    `imported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_student_question` (`survey_id`, `student_rollno`, `question_id`),
    FOREIGN KEY (`survey_id`) REFERENCES `course_surveys`(`survey_id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_rollno`) REFERENCES `students`(`roll_no`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `course_survey_questions`(`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Stakeholder Surveys
CREATE TABLE `stakeholder_surveys` (
    `survey_id` BIGINT NOT NULL AUTO_INCREMENT,
    `programme_id` INT(11) NOT NULL,
    `batch_year` INT NOT NULL,
    `stakeholder_type` ENUM('Alumni', 'Employer', 'Graduate Exit', 'Parent', 'Academic Peer') NOT NULL,
    `title` VARCHAR(255) DEFAULT 'Stakeholder Survey',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`survey_id`),
    UNIQUE KEY `uk_prog_batch_type` (`programme_id`, `batch_year`, `stakeholder_type`),
    FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`programme_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Stakeholder Survey Questions
CREATE TABLE `stakeholder_survey_questions` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `survey_id` BIGINT NOT NULL,
    `question_number` SMALLINT NOT NULL,
    `question_text` TEXT NOT NULL,
    `po_name` VARCHAR(5) NOT NULL, -- PO1-PO12, PSO1-PSO3
    `mapping_weight` DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (`mapping_weight` BETWEEN 0.00 AND 1.00),
    PRIMARY KEY (`question_id`),
    UNIQUE KEY `uk_stk_survey_qnum` (`survey_id`, `question_number`),
    FOREIGN KEY (`survey_id`) REFERENCES `stakeholder_surveys`(`survey_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Stakeholder Survey Responses (Replaces the flat stakeholder_survey_responses)
CREATE TABLE `stakeholder_survey_responses_v2` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `survey_id` BIGINT NOT NULL,
    `respondent_identifier` VARCHAR(255) NOT NULL,
    `respondent_name` VARCHAR(255) DEFAULT NULL,
    `qualification` VARCHAR(255) DEFAULT NULL,
    `question_id` BIGINT NOT NULL,
    `likert_rating` TINYINT NOT NULL CHECK (`likert_rating` BETWEEN 1 AND 5),
    `imported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_respondent_question` (`survey_id`, `respondent_identifier`, `question_id`),
    FOREIGN KEY (`survey_id`) REFERENCES `stakeholder_surveys`(`survey_id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `stakeholder_survey_questions`(`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
