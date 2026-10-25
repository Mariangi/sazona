CREATE TABLE `swipe_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`created_by` integer NOT NULL,
	`deck_recipe_ids` text NOT NULL,
	`status` text NOT NULL,
	`matched_recipe_id` integer,
	`shopping_list_id` integer,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`group_id`) REFERENCES `family_groups`(`id`),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
	FOREIGN KEY (`matched_recipe_id`) REFERENCES `recipes`(`id`),
	FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`)
);
--> statement-breakpoint
CREATE TABLE `swipe_session_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `swipe_sessions`(`id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `swipe_participants_session_user_idx` ON `swipe_session_participants` (`session_id`,`user_id`);
--> statement-breakpoint
CREATE TABLE `swipe_session_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `swipe_sessions`(`id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `swipe_likes_session_user_recipe_idx` ON `swipe_session_likes` (`session_id`,`user_id`,`recipe_id`);
--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD COLUMN `checked_by` integer REFERENCES `users`(`id`);
--> statement-breakpoint
ALTER TABLE `shopping_list_items` ADD COLUMN `checked_at` text;
