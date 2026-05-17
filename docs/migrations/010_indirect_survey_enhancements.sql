-- =============================================
-- NBA DATABASE MIGRATION v9.0 -> v10.0
-- Stakeholder survey enhancements (respondent_name, qualification)
-- =============================================

USE `nba_db`;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `stakeholder_survey_responses`
    ADD COLUMN `respondent_name` VARCHAR(255) NULL AFTER `respondent_identifier`,
    ADD COLUMN `qualification` VARCHAR(255) NULL AFTER `respondent_name`;

SET FOREIGN_KEY_CHECKS = 1;
