CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`mission` text NOT NULL,
	`current_knowledge` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
