import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  servings: integer('servings').notNull(),
  prepTime: integer('prep_time').notNull(),
  category: text('category'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const recipeIngredients = sqliteTable('recipe_ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  name: text('name').notNull(),
  quantity: text('quantity'),
  unit: text('unit'),
  orderIndex: integer('order_index').notNull(),
});

export const recipeSteps = sqliteTable('recipe_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  description: text('description').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const familyGroups = sqliteTable('family_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const familyMembers = sqliteTable('family_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => familyGroups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull().$default(() => 'member'), // 'admin' | 'member'
  joinedAt: text('joined_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const groupMessages = sqliteTable('group_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => familyGroups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  recipeId: integer('recipe_id').references(() => recipes.id),
  message: text('message'),
  status: text('status').notNull().$default(() => 'active'), // 'active' | 'voting' | 'accepted'
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const proposalVotes = sqliteTable('proposal_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  messageId: integer('message_id').notNull().references(() => groupMessages.id),
  userId: integer('user_id').notNull().references(() => users.id),
  vote: text('vote').notNull(), // 'si' | 'no' | 'tal_vez'
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const shoppingLists = sqliteTable('shopping_lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').references(() => familyGroups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const savedRecipes = sqliteTable('saved_recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const shoppingListItems = sqliteTable('shopping_list_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listId: integer('list_id').notNull().references(() => shoppingLists.id),
  name: text('name').notNull(),
  quantity: text('quantity'),
  unit: text('unit'),
  checked: integer('checked', { mode: 'boolean' }).notNull().$default(() => false),
  orderIndex: integer('order_index').notNull(),
});

export const mealPlans = sqliteTable('meal_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  weekStart: text('week_start').notNull(),
  servingsMultiplier: integer('servings_multiplier').notNull().$default(() => 1),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const mealPlanEntries = sqliteTable('meal_plan_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mealPlanId: integer('meal_plan_id').notNull().references(() => mealPlans.id),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  dayOfWeek: integer('day_of_week').notNull(),
  mealType: text('meal_type').notNull().$default(() => 'lunch'), // 'breakfast' | 'lunch' | 'snack' | 'dinner'
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
