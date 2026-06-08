import type {
  AuthResponse, UserResponse, RecipeResponse, RecipeListItem, RecipeMatch,
  FamilyGroup, GroupMessage, ShoppingList, ShoppingListDetail,
  SavedRecipe,
} from '@sasona/shared'

const API_BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error del servidor' }))
      throw new Error(error.message || 'Error del servidor')
    }

    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor. Asegúrate de ejecutar "npm run dev:server" en otra terminal.')
    }
    throw err
  }
}

export const api = {
  register: (data: { email: string; username: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () =>
    request<UserResponse>('/auth/me'),

  getRecipes: () =>
    request<RecipeListItem[]>('/recipes'),

  getAllRecipes: () =>
    request<RecipeListItem[]>('/recipes/all'),

  getDiscoverRecipes: (page = 1, limit = 12, category?: string) =>
    request<{ recipes: (RecipeListItem & { author: { id: number; username: string; avatarUrl: string | null } | null })[]; total: number; page: number; limit: number }>(`/recipes/discover?page=${page}&limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}`),

  updateProfile: (data: { email: string; username: string }) =>
    request<UserResponse>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  uploadAvatar: (avatarBase64: string) =>
    request<{ avatarUrl: string }>('/auth/avatar', { method: 'POST', body: JSON.stringify({ avatarBase64 }) }),

  getRandomRecipe: () =>
    request<RecipeResponse>('/recipes/random'),

  getRecipeById: (id: number) =>
    request<RecipeResponse>(`/recipes/${id}`),

  findRecipesByIngredients: (data: { ingredients: string[]; allowExtra: boolean }) =>
    request<RecipeMatch[]>('/recipes/find-by-ingredients', { method: 'POST', body: JSON.stringify(data) }),

  // Groups
  createGroup: (name: string) =>
    request<FamilyGroup>('/groups', { method: 'POST', body: JSON.stringify({ name }) }),

  joinGroup: (inviteCode: string) =>
    request<FamilyGroup>('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),

  getGroups: () =>
    request<FamilyGroup[]>('/groups'),

  getGroup: (id: number) =>
    request<any>('/groups/' + id),

  updateGroup: (id: number, name: string) =>
    request<FamilyGroup>('/groups/' + id, { method: 'PUT', body: JSON.stringify({ name }) }),

  // Messages
  getMessages: (groupId: number) =>
    request<GroupMessage[]>('/groups/' + groupId + '/messages'),

  sendMessage: (groupId: number, data: { message?: string; recipeId?: number }) =>
    request<GroupMessage>('/groups/' + groupId + '/messages', { method: 'POST', body: JSON.stringify(data) }),

  castVote: (messageId: number, vote: string) =>
    request<{ si: number; no: number; tal_vez: number; userVote: string }>('/messages/' + messageId + '/vote', { method: 'POST', body: JSON.stringify({ vote }) }),

  closeVote: (messageId: number) =>
    request<{ accepted: boolean; shoppingListId?: number; si: number; no: number; tal_vez: number }>('/messages/' + messageId + '/close-vote', { method: 'POST' }),

  // Shopping lists
  getShoppingLists: () =>
    request<ShoppingList[]>('/shopping-lists'),

  createShoppingList: (data: { name: string; items: { name: string; quantity?: string; unit?: string }[] }) =>
    request<{ id: number; name: string }>('/shopping-lists', { method: 'POST', body: JSON.stringify(data) }),

  getShoppingList: (id: number) =>
    request<ShoppingListDetail>('/shopping-lists/' + id),

  toggleShoppingItem: (itemId: number, checked: boolean) =>
    request<{ id: number; checked: boolean }>('/shopping-list-items/' + itemId, { method: 'PATCH', body: JSON.stringify({ checked }) }),

  deleteShoppingList: (id: number) =>
    request<{ message: string }>('/shopping-lists/' + id, { method: 'DELETE' }),

  // Saved recipes
  getSavedRecipes: () =>
    request<SavedRecipe[]>('/recipes/saved'),

  saveRecipe: (recipeId: number) =>
    request<{ id: number; recipeId: number; savedAt: string }>('/recipes/saved', { method: 'POST', body: JSON.stringify({ recipeId }) }),

  unsaveRecipe: (recipeId: number) =>
    request<{ message: string }>('/recipes/saved/' + recipeId, { method: 'DELETE' }),

  isRecipeSaved: (recipeId: number) =>
    request<{ saved: boolean }>('/recipes/' + recipeId + '/saved'),

  deleteRecipe: (id: number) =>
    request<{ message: string }>('/recipes/' + id, { method: 'DELETE' }),

  createRecipe: (data: {
    name: string;
    imageBase64?: string;
    servings: number;
    prepTime: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    steps: { description: string }[];
  }) =>
    request<RecipeResponse>('/recipes', { method: 'POST', body: JSON.stringify(data) }),

  updateRecipe: (id: number, data: {
    name: string;
    imageBase64?: string;
    servings: number;
    prepTime: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    steps: { description: string }[];
  }) =>
    request<RecipeResponse>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}
