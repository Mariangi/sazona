ALTER TABLE `meal_plans` ADD COLUMN `servings_multiplier` integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `meal_plan_entries` ADD COLUMN `meal_type` text NOT NULL DEFAULT 'lunch';
