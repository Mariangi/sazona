export interface UserResponse {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Step {
  description: string;
}

export interface RecipeResponse {
  id: number;
  userId: number;
  name: string;
  imageUrl: string | null;
  servings: number;
  prepTime: number;
  category: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListItem {
  id: number;
  name: string;
  imageUrl: string | null;
  servings: number;
  prepTime: number;
  category: string | null;
  ingredientCount: number;
  stepCount: number;
  createdAt: string;
}

export interface RecipeMatch {
  id: number;
  name: string;
  imageUrl: string | null;
  servings: number;
  prepTime: number;
  matchCount: number;
  totalCount: number;
  matchPercentage: number;
  missingIngredients: string[];
}

export interface FamilyGroup {
  id: number;
  name: string;
  inviteCode: string;
  createdBy: number;
  memberCount: number;
  createdAt: string;
}

export interface FamilyMember {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  role: string;
}

export interface GroupMessage {
  id: number;
  groupId: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  recipeId: number | null;
  recipeName: string | null;
  message: string | null;
  status: string;
  votes: { si: number; no: number; tal_vez: number };
  userVote: string | null;
  createdAt: string;
}

export interface ShoppingList {
  id: number;
  groupId: number | null;
  userId: number;
  name: string;
  groupName: string | null;
  itemCount: number;
  checkedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: number;
  listId: number;
  name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  orderIndex: number;
}

export interface SavedRecipe {
  id: number;
  recipeId: number;
  name: string;
  imageUrl: string | null;
  servings: number;
  prepTime: number;
  category: string | null;
  ingredientCount: number;
  stepCount: number;
  savedAt: string;
}

export interface ShoppingListDetail {
  id: number;
  groupId: number | null;
  userId: number;
  name: string;
  groupName: string | null;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}
