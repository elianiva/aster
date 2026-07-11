ALTER TABLE `lessons` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `records` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `references` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `glossary` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `resources` ADD `updated_at` integer NOT NULL DEFAULT 0;
