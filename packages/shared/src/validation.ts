import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres').max(30),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Nombre del ingrediente requerido'),
  quantity: z.string().optional().default(''),
  unit: z.string().optional().default(''),
});

export const stepSchema = z.object({
  description: z.string().min(1, 'Descripción del paso requerida'),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, 'Nombre de la receta requerido'),
  imageBase64: z.string().optional(),
  servings: z.coerce.number().int().min(1, 'Al menos 1 comensal'),
  prepTime: z.coerce.number().int().min(1, 'Tiempo mínimo 1 minuto'),
  category: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Al menos un ingrediente'),
  steps: z.array(stepSchema).min(1, 'Al menos un paso'),
});

export const updateRecipeSchema = z.object({
  name: z.string().min(1, 'Nombre de la receta requerido'),
  imageBase64: z.string().optional(),
  servings: z.coerce.number().int().min(1, 'Al menos 1 comensal'),
  prepTime: z.coerce.number().int().min(1, 'Tiempo mínimo 1 minuto'),
  category: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Al menos un ingrediente'),
  steps: z.array(stepSchema).min(1, 'Al menos un paso'),
});

export const updateProfileSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres').max(30),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'Nueva contraseña debe tener al menos 6 caracteres'),
});

export const avatarSchema = z.object({
  avatarBase64: z.string().min(1, 'Imagen requerida'),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Nombre del grupo requerido').max(50),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Código de invitación requerido'),
});

export const createMessageSchema = z.object({
  message: z.string().optional(),
  recipeId: z.number().int().positive().optional(),
}).refine(data => data.message || data.recipeId, {
  message: 'Debes escribir un mensaje o elegir una receta',
});

export const castVoteSchema = z.object({
  vote: z.enum(['si', 'no', 'tal_vez']),
});

export const createShoppingListSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.string().optional(),
    unit: z.string().optional(),
  })),
});

export const findIngredientsSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1, 'Al menos un ingrediente'),
  allowExtra: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
