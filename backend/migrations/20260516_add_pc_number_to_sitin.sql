-- Migration: Add pc_number to sitin table
-- This script is idempotent and safe to run on existing databases.

SET @dbname = DATABASE();
SET @tablename = 'sitin';
SET @columnname = 'pc_number';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE sitin ADD COLUMN pc_number INT DEFAULT 0'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
