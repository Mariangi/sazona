import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { createRecipeSchema, updateRecipeSchema, findIngredientsSchema } from '@sasona/shared';
import { eq, ne, desc, inArray, and, sql } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

export function recipeRoutes(app: FastifyInstance) {

  app.get('/api/recipes', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const recipes = db.select().from(schema.recipes)
      .where(eq(schema.recipes.userId, userId))
      .orderBy(desc(schema.recipes.createdAt))
      .all();

    if (recipes.length === 0) return [];

    const recipeIds = recipes.map(r => r.id);

    const allIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(inArray(schema.recipeIngredients.recipeId, recipeIds))
      .all();

    const allSteps = db.select()
      .from(schema.recipeSteps)
      .where(inArray(schema.recipeSteps.recipeId, recipeIds))
      .all();

    return recipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      ingredientCount: allIngredients.filter(i => i.recipeId === recipe.id).length,
      stepCount: allSteps.filter(s => s.recipeId === recipe.id).length,
      createdAt: recipe.createdAt,
    }));
  });

  app.get('/api/recipes/discover', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const offset = (page - 1) * limit;

    const total = db.select({ count: sql<number>`count(*)` })
      .from(schema.recipes)
      .where(ne(schema.recipes.userId, userId))
      .get()!;

    const recipes = db.select()
      .from(schema.recipes)
      .where(ne(schema.recipes.userId, userId))
      .orderBy(desc(schema.recipes.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    if (recipes.length === 0) return { recipes: [], total: Number(total.count), page, limit };

    const recipeIds = recipes.map(r => r.id);

    const allIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(inArray(schema.recipeIngredients.recipeId, recipeIds))
      .all();

    const allSteps = db.select()
      .from(schema.recipeSteps)
      .where(inArray(schema.recipeSteps.recipeId, recipeIds))
      .all();

    const authorIds = [...new Set(recipes.map(r => r.userId))];
    const authors = db.select({ id: schema.users.id, username: schema.users.username, avatarUrl: schema.users.avatarUrl })
      .from(schema.users)
      .where(inArray(schema.users.id, authorIds))
      .all();
    const authorMap = new Map(authors.map(a => [a.id, a]));

    return {
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        ingredientCount: allIngredients.filter(i => i.recipeId === recipe.id).length,
        stepCount: allSteps.filter(s => s.recipeId === recipe.id).length,
        createdAt: recipe.createdAt,
        author: authorMap.get(recipe.userId) || null,
      })),
      total: Number(total.count),
      page,
      limit,
    };
  });

  app.get('/api/recipes/random', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;

    const recipes = db.select().from(schema.recipes)
      .where(eq(schema.recipes.userId, userId))
      .all();

    if (recipes.length === 0) {
      return reply.status(404).send({ message: 'No tienes recetas aún', statusCode: 404 });
    }

    const recipe = recipes[Math.floor(Math.random() * recipes.length)];

    const ingredients = db.select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, recipe.id))
      .all()
      .map(({ name, quantity, unit }) => ({ name, quantity: quantity || '', unit: unit || '' }));

    const steps = db.select()
      .from(schema.recipeSteps)
      .where(eq(schema.recipeSteps.recipeId, recipe.id))
      .all()
      .map(({ description }) => ({ description }));

    return {
      id: recipe.id,
      userId: recipe.userId,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      ingredients,
      steps,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  });

  app.get('/api/recipes/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const recipe = db.select().from(schema.recipes)
      .where(eq(schema.recipes.id, Number(id)))
      .get();

    if (!recipe) {
      return reply.status(404).send({ message: 'Receta no encontrada', statusCode: 404 });
    }

    const ingredients = db.select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, recipe.id))
      .all()
      .map(({ name, quantity, unit }) => ({ name, quantity: quantity || '', unit: unit || '' }));

    const steps = db.select()
      .from(schema.recipeSteps)
      .where(eq(schema.recipeSteps.recipeId, recipe.id))
      .all()
      .map(({ description }) => ({ description }));

    return {
      id: recipe.id,
      userId: recipe.userId,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      ingredients,
      steps,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  });

  app.post('/api/recipes/find-by-ingredients', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;

    const parsed = findIngredientsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Datos inválidos', statusCode: 400 });
    }

    const { ingredients: fridgeIngredients, allowExtra } = parsed.data;
    const normalized = fridgeIngredients.map(i =>
      i.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    const userRecipes = db.select().from(schema.recipes)
      .where(eq(schema.recipes.userId, userId))
      .all();

    if (userRecipes.length === 0) {
      return reply.status(404).send({ message: 'No tienes recetas aún', statusCode: 404 });
    }

    const recipeIds = userRecipes.map(r => r.id);

    const allIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(inArray(schema.recipeIngredients.recipeId, recipeIds))
      .all();

    const recipeMap = new Map<number, typeof allIngredients>();
    for (const ing of allIngredients) {
      if (!recipeMap.has(ing.recipeId)) recipeMap.set(ing.recipeId, []);
      recipeMap.get(ing.recipeId)!.push(ing);
    }

    const results = userRecipes.map(recipe => {
      const recipeIngs = recipeMap.get(recipe.id) || [];
      const matchInfo = recipeIngs.map(ri => {
        const normalizedName = ri.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const has = normalized.some(f => normalizedName.includes(f) || f.includes(normalizedName));
        return { name: ri.name, matched: has };
      });

      const matched = matchInfo.filter(m => m.matched);
      const missing = matchInfo.filter(m => !m.matched).map(m => m.name);

      if (!allowExtra && missing.length > 0) return null;

      return {
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        matchCount: matched.length,
        totalCount: recipeIngs.length,
        matchPercentage: recipeIngs.length > 0 ? Math.round((matched.length / recipeIngs.length) * 100) : 0,
        missingIngredients: missing,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.matchPercentage - a.matchPercentage || (a.missingIngredients.length - b.missingIngredients.length));

    return results;
  });

  app.post('/api/recipes', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = createRecipeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0].message,
        statusCode: 400,
      });
    }

    const { name, imageBase64, servings, prepTime, ingredients, steps } = parsed.data;
    const { userId } = (request as any).user;

    let imageUrl: string | null = null;

    if (imageBase64) {
      const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].split('/')[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${randomUUID()}.${ext}`;
        const filepath = join(UPLOADS_DIR, filename);

        if (!existsSync(UPLOADS_DIR)) {
          await mkdir(UPLOADS_DIR, { recursive: true });
        }

        await writeFile(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
      }
    }

    const recipe = db.insert(schema.recipes).values({
      userId,
      name,
      imageUrl,
      servings,
      prepTime,
    }).returning().get();

    if (ingredients.length > 0) {
      db.insert(schema.recipeIngredients).values(
        ingredients.map((ing, i) => ({
          recipeId: recipe.id,
          name: ing.name,
          quantity: ing.quantity || null,
          unit: ing.unit || null,
          orderIndex: i,
        }))
      ).run();
    }

    if (steps.length > 0) {
      db.insert(schema.recipeSteps).values(
        steps.map((step, i) => ({
          recipeId: recipe.id,
          description: step.description,
          orderIndex: i,
        }))
      ).run();
    }

    const savedIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, recipe.id))
      .all()
      .map(({ name, quantity, unit }) => ({ name, quantity: quantity || '', unit: unit || '' }));

    const savedSteps = db.select()
      .from(schema.recipeSteps)
      .where(eq(schema.recipeSteps.recipeId, recipe.id))
      .all()
      .map(({ description }) => ({ description }));

    return reply.status(201).send({
      id: recipe.id,
      userId: recipe.userId,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      ingredients: savedIngredients,
      steps: savedSteps,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    });
  });

  app.put('/api/recipes/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const existing = db.select().from(schema.recipes)
      .where(eq(schema.recipes.id, Number(id)))
      .get();

    if (!existing || existing.userId !== userId) {
      return reply.status(404).send({ message: 'Receta no encontrada', statusCode: 404 });
    }

    const parsed = updateRecipeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0].message,
        statusCode: 400,
      });
    }

    const { name, imageBase64, servings, prepTime, ingredients, steps } = parsed.data;

    let imageUrl = existing.imageUrl;

    if (imageBase64 !== undefined) {
      if (imageBase64 === '') {
        imageUrl = null;
      } else {
        const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1].split('/')[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `${randomUUID()}.${ext}`;
          const filepath = join(UPLOADS_DIR, filename);

          if (!existsSync(UPLOADS_DIR)) {
            await mkdir(UPLOADS_DIR, { recursive: true });
          }

          await writeFile(filepath, buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }
    }

    db.update(schema.recipes)
      .set({ name, imageUrl, servings, prepTime })
      .where(eq(schema.recipes.id, Number(id)))
      .run();

    db.delete(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, Number(id)))
      .run();
    if (ingredients.length > 0) {
      db.insert(schema.recipeIngredients).values(
        ingredients.map((ing, i) => ({
          recipeId: Number(id),
          name: ing.name,
          quantity: ing.quantity || null,
          unit: ing.unit || null,
          orderIndex: i,
        }))
      ).run();
    }

    db.delete(schema.recipeSteps)
      .where(eq(schema.recipeSteps.recipeId, Number(id)))
      .run();
    if (steps.length > 0) {
      db.insert(schema.recipeSteps).values(
        steps.map((step, i) => ({
          recipeId: Number(id),
          description: step.description,
          orderIndex: i,
        }))
      ).run();
    }

    const savedIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, Number(id)))
      .all()
      .map(({ name, quantity, unit }) => ({ name, quantity: quantity || '', unit: unit || '' }));

    const savedSteps = db.select()
      .from(schema.recipeSteps)
      .where(eq(schema.recipeSteps.recipeId, Number(id)))
      .all()
      .map(({ description }) => ({ description }));

    const updated = db.select().from(schema.recipes)
      .where(eq(schema.recipes.id, Number(id)))
      .get()!;

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      imageUrl: updated.imageUrl,
      servings: updated.servings,
      prepTime: updated.prepTime,
      ingredients: savedIngredients,
      steps: savedSteps,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  });

  // ─── SAVED RECIPES ──────────────────────────────────────────

  app.get('/api/recipes/saved', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const saved = db.select({
      id: schema.savedRecipes.id,
      recipeId: schema.savedRecipes.recipeId,
      name: schema.recipes.name,
      imageUrl: schema.recipes.imageUrl,
      servings: schema.recipes.servings,
      prepTime: schema.recipes.prepTime,
      savedAt: schema.savedRecipes.createdAt,
    }).from(schema.savedRecipes)
      .innerJoin(schema.recipes, eq(schema.savedRecipes.recipeId, schema.recipes.id))
      .where(eq(schema.savedRecipes.userId, userId))
      .orderBy(desc(schema.savedRecipes.createdAt))
      .all();

    if (saved.length === 0) return [];

    const recipeIds = saved.map(s => s.recipeId);

    const counts = db.select({
      recipeId: schema.recipeIngredients.recipeId,
      count: sql<number>`count(*)`,
    }).from(schema.recipeIngredients)
      .where(inArray(schema.recipeIngredients.recipeId, recipeIds))
      .groupBy(schema.recipeIngredients.recipeId)
      .all();

    const stepCounts = db.select({
      recipeId: schema.recipeSteps.recipeId,
      count: sql<number>`count(*)`,
    }).from(schema.recipeSteps)
      .where(inArray(schema.recipeSteps.recipeId, recipeIds))
      .groupBy(schema.recipeSteps.recipeId)
      .all();

    const ingCountMap = new Map(counts.map(c => [c.recipeId, c.count]));
    const stepCountMap = new Map(stepCounts.map(c => [c.recipeId, c.count]));

    return saved.map(s => ({
      id: s.id,
      recipeId: s.recipeId,
      name: s.name,
      imageUrl: s.imageUrl,
      servings: s.servings,
      prepTime: s.prepTime,
      ingredientCount: ingCountMap.get(s.recipeId) || 0,
      stepCount: stepCountMap.get(s.recipeId) || 0,
      savedAt: s.savedAt,
    }));
  });

  app.post('/api/recipes/saved', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { recipeId } = request.body as { recipeId: number };

    if (!recipeId) return reply.status(400).send({ message: 'recipeId requerido', statusCode: 400 });

    const existing = db.select().from(schema.savedRecipes)
      .where(and(eq(schema.savedRecipes.userId, userId), eq(schema.savedRecipes.recipeId, recipeId)))
      .get();

    if (existing) return reply.status(409).send({ message: 'Ya guardada', statusCode: 409 });

    const saved = db.insert(schema.savedRecipes).values({ userId, recipeId }).returning().get();
    return { id: saved.id, recipeId: saved.recipeId, savedAt: saved.createdAt };
  });

  app.delete('/api/recipes/saved/:recipeId', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { recipeId } = request.params as { recipeId: string };

    const saved = db.select().from(schema.savedRecipes)
      .where(and(eq(schema.savedRecipes.userId, userId), eq(schema.savedRecipes.recipeId, Number(recipeId))))
      .get();

    if (!saved) return reply.status(404).send({ message: 'No encontrada', statusCode: 404 });

    db.delete(schema.savedRecipes).where(eq(schema.savedRecipes.id, saved.id)).run();
    return { message: 'Receta eliminada de guardados' };
  });

  app.get('/api/recipes/:id/saved', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const saved = db.select().from(schema.savedRecipes)
      .where(and(eq(schema.savedRecipes.userId, userId), eq(schema.savedRecipes.recipeId, Number(id))))
      .get();

    return { saved: !!saved };
  });
}
