CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL DEFAULT '',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE INDEX `threads_workspace_id_idx` ON `threads` (`workspace_id`);
