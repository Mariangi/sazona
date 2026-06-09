CREATE TABLE `meal_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`week_start` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_plan_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_plan_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	`day_of_week` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans`(`id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
);
