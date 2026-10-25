import { FastifyInstance } from 'fastify';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { createMealPlanSchema, updateMealPlanEntriesSchema } from '@sasona/shared';
import { eq, and, inArray } from 'drizzle-orm';

export function mealPlanRoutes(app: FastifyInstance) {

  app.get('/api/meal-plans', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const plans = db.select()
      .from(schema.mealPlans)
      .where(eq(schema.mealPlans.userId, userId))
      .orderBy(schema.mealPlans.weekStart)
      .all();

    if (plans.length === 0) return [];

    const planIds = plans.map(p => p.id);
    const allEntries = db.select()
      .from(schema.mealPlanEntries)
      .where(inArray(schema.mealPlanEntries.mealPlanId, planIds))
      .all();

    const recipeIds = [...new Set(allEntries.map(e => e.recipeId))];
    const recipes = recipeIds.length > 0
      ? db.select({ id: schema.recipes.id, name: schema.recipes.name, imageUrl: schema.recipes.imageUrl })
        .from(schema.recipes)
        .where(inArray(schema.recipes.id, recipeIds))
        .all()
      : [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    const entryMap = new Map<number, typeof allEntries>();
    for (const e of allEntries) {
      if (!entryMap.has(e.mealPlanId)) entryMap.set(e.mealPlanId, []);
      entryMap.get(e.mealPlanId)!.push(e);
    }

    return plans.map(plan => {
      const entries = (entryMap.get(plan.id) || []).map(e => ({
        dayOfWeek: e.dayOfWeek,
        mealType: e.mealType,
        recipeId: e.recipeId,
        recipeName: recipeMap.get(e.recipeId)?.name || '',
        recipeImage: recipeMap.get(e.recipeId)?.imageUrl || null,
      }));

      return {
        id: plan.id,
        weekStart: plan.weekStart,
        servingsMultiplier: plan.servingsMultiplier,
        createdAt: plan.createdAt,
        entries,
      };
    });
  });

  app.post('/api/meal-plans', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const parsed = createMealPlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });
    }

    const existing = db.select()
      .from(schema.mealPlans)
      .where(and(
        eq(schema.mealPlans.userId, userId),
        eq(schema.mealPlans.weekStart, parsed.data.weekStart),
      ))
      .get();

    if (existing) {
      const entries = db.select()
        .from(schema.mealPlanEntries)
        .where(eq(schema.mealPlanEntries.mealPlanId, existing.id))
        .all();

      const recipeIds = [...new Set(entries.map(e => e.recipeId))];
      const recipes = recipeIds.length > 0
        ? db.select({ id: schema.recipes.id, name: schema.recipes.name, imageUrl: schema.recipes.imageUrl })
          .from(schema.recipes)
          .where(inArray(schema.recipes.id, recipeIds))
          .all()
        : [];
      const recipeMap = new Map(recipes.map(r => [r.id, r]));

      return {
        id: existing.id,
        weekStart: existing.weekStart,
        servingsMultiplier: existing.servingsMultiplier,
        createdAt: existing.createdAt,
        entries: entries.map(e => ({
          dayOfWeek: e.dayOfWeek,
          mealType: e.mealType,
          recipeId: e.recipeId,
          recipeName: recipeMap.get(e.recipeId)?.name || '',
          recipeImage: recipeMap.get(e.recipeId)?.imageUrl || null,
        })),
      };
    }

    const plan = db.insert(schema.mealPlans)
      .values({ userId, weekStart: parsed.data.weekStart, servingsMultiplier: 1 })
      .returning()
      .get();

    return {
      id: plan.id,
      weekStart: plan.weekStart,
      servingsMultiplier: plan.servingsMultiplier,
      createdAt: plan.createdAt,
      entries: [],
    };
  });

  app.get('/api/meal-plans/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const plan = db.select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, Number(id)), eq(schema.mealPlans.userId, userId)))
      .get();

    if (!plan) {
      return reply.status(404).send({ message: 'Plan no encontrado', statusCode: 404 });
    }

    const entries = db.select()
      .from(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .all();

    const recipeIds = [...new Set(entries.map(e => e.recipeId))];
    const recipes = recipeIds.length > 0
      ? db.select({ id: schema.recipes.id, name: schema.recipes.name, imageUrl: schema.recipes.imageUrl })
        .from(schema.recipes)
        .where(inArray(schema.recipes.id, recipeIds))
        .all()
      : [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    return {
      id: plan.id,
      weekStart: plan.weekStart,
      servingsMultiplier: plan.servingsMultiplier,
      createdAt: plan.createdAt,
      entries: entries.map(e => ({
        dayOfWeek: e.dayOfWeek,
        mealType: e.mealType,
        recipeId: e.recipeId,
        recipeName: recipeMap.get(e.recipeId)?.name || '',
        recipeImage: recipeMap.get(e.recipeId)?.imageUrl || null,
      })),
    };
  });

  app.put('/api/meal-plans/:id/servings', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };
    const { servingsMultiplier } = request.body as { servingsMultiplier: number };

    if (!servingsMultiplier || servingsMultiplier < 1) {
      return reply.status(400).send({ message: 'Invalid servings multiplier', statusCode: 400 });
    }

    const plan = db.select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, Number(id)), eq(schema.mealPlans.userId, userId)))
      .get();

    if (!plan) {
      return reply.status(404).send({ message: 'Plan no encontrado', statusCode: 404 });
    }

    db.update(schema.mealPlans)
      .set({ servingsMultiplier })
      .where(eq(schema.mealPlans.id, plan.id))
      .run();

    const updatedPlan = db.select()
      .from(schema.mealPlans)
      .where(eq(schema.mealPlans.id, plan.id))
      .get();

    const entries = db.select()
      .from(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .all();

    const recipeIds = [...new Set(entries.map(e => e.recipeId))];
    const recipes = recipeIds.length > 0
      ? db.select({ id: schema.recipes.id, name: schema.recipes.name, imageUrl: schema.recipes.imageUrl })
        .from(schema.recipes)
        .where(inArray(schema.recipes.id, recipeIds))
        .all()
      : [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    return {
      id: updatedPlan.id,
      weekStart: updatedPlan.weekStart,
      servingsMultiplier: updatedPlan.servingsMultiplier,
      createdAt: updatedPlan.createdAt,
      entries: entries.map(e => ({
        dayOfWeek: e.dayOfWeek,
        mealType: e.mealType,
        recipeId: e.recipeId,
        recipeName: recipeMap.get(e.recipeId)?.name || '',
        recipeImage: recipeMap.get(e.recipeId)?.imageUrl || null,
      })),
    };
  });

  app.put('/api/meal-plans/:id/entries', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const plan = db.select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, Number(id)), eq(schema.mealPlans.userId, userId)))
      .get();

    if (!plan) {
      return reply.status(404).send({ message: 'Plan no encontrado', statusCode: 404 });
    }

    const parsed = updateMealPlanEntriesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });
    }

    db.delete(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .run();

    if (parsed.data.entries.length > 0) {
      db.insert(schema.mealPlanEntries).values(
        parsed.data.entries.map(e => ({
          mealPlanId: plan.id,
          recipeId: e.recipeId,
          dayOfWeek: e.dayOfWeek,
          mealType: e.mealType || 'lunch',
        }))
      ).run();
    }

    const entries = db.select()
      .from(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .all();

    const recipeIds = [...new Set(entries.map(e => e.recipeId))];
    const recipes = recipeIds.length > 0
      ? db.select({ id: schema.recipes.id, name: schema.recipes.name, imageUrl: schema.recipes.imageUrl })
        .from(schema.recipes)
        .where(inArray(schema.recipes.id, recipeIds))
        .all()
      : [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    return {
      id: plan.id,
      weekStart: plan.weekStart,
      servingsMultiplier: plan.servingsMultiplier,
      createdAt: plan.createdAt,
      entries: entries.map(e => ({
        dayOfWeek: e.dayOfWeek,
        mealType: e.mealType,
        recipeId: e.recipeId,
        recipeName: recipeMap.get(e.recipeId)?.name || '',
        recipeImage: recipeMap.get(e.recipeId)?.imageUrl || null,
      })),
    };
  });

  app.post('/api/meal-plans/:id/generate-list', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };
    const { servingsMultiplier = 1 } = request.body as { servingsMultiplier?: number };

    const plan = db.select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, Number(id)), eq(schema.mealPlans.userId, userId)))
      .get();

    if (!plan) {
      return reply.status(404).send({ message: 'Plan no encontrado', statusCode: 404 });
    }

    const entries = db.select()
      .from(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .all();

    if (entries.length === 0) {
      return reply.status(400).send({ message: 'El plan no tiene recetas asignadas', statusCode: 400 });
    }

    const recipeIds = [...new Set(entries.map(e => e.recipeId))];

    const allIngredients = db.select()
      .from(schema.recipeIngredients)
      .where(inArray(schema.recipeIngredients.recipeId, recipeIds))
      .all();

    const aggregated = new Map<string, { quantity: string; unit: string }[]>();
    for (const ing of allIngredients) {
      const key = ing.name.toLowerCase().trim();
      if (!aggregated.has(key)) aggregated.set(key, []);
      aggregated.get(key)!.push({
        quantity: ing.quantity || '',
        unit: ing.unit || '',
      });
    }

    const items = Array.from(aggregated.entries()).map(([name, instances]) => {
      const first = instances[0];
      const allSameUnit = instances.every(i => i.unit === first.unit);

      if (allSameUnit && first.quantity) {
        let totalQty = instances.reduce((sum, i) => {
          const q = parseFloat(i.quantity.replace(',', '.'));
          return sum + (isNaN(q) ? 0 : q);
        }, 0);
        totalQty *= servingsMultiplier;
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity: totalQty > 0 ? String(Math.round(totalQty * 100) / 100) : '',
          unit: first.unit,
        };
      }

      const parts = instances.map(i =>
        [i.quantity, i.unit].filter(Boolean).join(' ')
      ).filter(Boolean).join(' + ');

      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        quantity: parts || '',
        unit: '',
      };
    });

    const recipeNames = db.select({ name: schema.recipes.name })
      .from(schema.recipes)
      .where(inArray(schema.recipes.id, recipeIds))
      .all()
      .map(r => r.name);

    const listName = `Menu semanal — ${recipeNames.join(', ')}`;
    const truncatedName = listName.length > 100 ? listName.substring(0, 97) + '...' : listName;

    const shoppingList = db.insert(schema.shoppingLists).values({
      userId,
      name: truncatedName,
    }).returning().get();

    if (items.length > 0) {
      db.insert(schema.shoppingListItems).values(
        items.map((item, i) => ({
          listId: shoppingList.id,
          name: item.name,
          quantity: item.quantity || null,
          unit: item.unit || null,
          orderIndex: i,
        }))
      ).run();
    }

    return { id: shoppingList.id, name: shoppingList.name };
  });

  app.delete('/api/meal-plans/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const plan = db.select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, Number(id)), eq(schema.mealPlans.userId, userId)))
      .get();

    if (!plan) {
      return reply.status(404).send({ message: 'Plan no encontrado', statusCode: 404 });
    }

    db.delete(schema.mealPlanEntries)
      .where(eq(schema.mealPlanEntries.mealPlanId, plan.id))
      .run();

    db.delete(schema.mealPlans)
      .where(eq(schema.mealPlans.id, plan.id))
      .run();

    return { message: 'Plan eliminado' };
  });
}
