-- =============================================
-- NBA DATABASE MIGRATION v8.0 -> v9.0
-- Programme weightage, stakeholder surveys
-- =============================================

USE `nba_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. ADD WEIGHTAGE TO PROGRAMMES
-- =============================================

ALTER TABLE `programmes`
    ADD COLUMN `direct_weightage` DECIMAL(5,2) DEFAULT 80.00 CHECK (`direct_weightage` >= 0 AND `direct_weightage` <= 100),
    ADD COLUMN `indirect_weightage` DECIMAL(5,2) DEFAULT 20.00 CHECK (`indirect_weightage` >= 0 AND `indirect_weightage` <= 100);

SET FOREIGN_KEY_CHECKS = 1;
