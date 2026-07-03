-- Backfill records without a title (from the nullable ADD COLUMN in 0004)
UPDATE `records` SET `title` = 'Untitled' WHERE `title` IS NULL;