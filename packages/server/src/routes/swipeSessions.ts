import { FastifyInstance } from 'fastify';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { submitSwipeLikeSchema } from '@sasona/shared';
import { eq, and, inArray } from 'drizzle-orm';

function hydrateDeck(recipeIds: number[]) {
  if (recipeIds.length === 0) return [];

  const recipes = db.select().from(schema.recipes).where(inArray(schema.recipes.id, recipeIds)).all();
  const allIngredients = db.select().from(schema.recipeIngredients)
    .where(inArray(schema.recipeIngredients.recipeId, recipeIds)).all();
  const allSteps = db.select().from(schema.recipeSteps)
    .where(inArray(schema.recipeSteps.recipeId, recipeIds)).all();
  const recipeMap = new Map(recipes.map(r => [r.id, r]));

  return recipeIds
    .map(id => recipeMap.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map(recipe => ({
      id: recipe.id, name: recipe.name, imageUrl: recipe.imageUrl,
      servings: recipe.servings, prepTime: recipe.prepTime,
      category: recipe.category, difficulty: recipe.difficulty,
      ingredientCount: allIngredients.filter(i => i.recipeId === recipe.id).length,
      stepCount: allSteps.filter(s => s.recipeId === recipe.id).length,
      createdAt: recipe.createdAt,
    }));
}

function generateShoppingListFromRecipe(groupId: number, userId: number, recipeId: number) {
  const recipe = db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).get();
  const ingredients = db.select().from(schema.recipeIngredients)
    .where(eq(schema.recipeIngredients.recipeId, recipeId)).all();

  const list = db.insert(schema.shoppingLists).values({
    groupId, userId, name: recipe?.name || 'Lista de compras',
  }).returning().get();

  if (ingredients.length > 0) {
    db.insert(schema.shoppingListItems).values(
      ingredients.map((ing, i) => ({
        listId: list.id, name: ing.name, quantity: ing.quantity, unit: ing.unit, orderIndex: i,
      }))
    ).run();
  }

  return list.id;
}

export function swipeSessionRoutes(app: FastifyInstance) {

  function buildStatus(sessionId: number, userId: number) {
    const session = db.select().from(schema.swipeSessions).where(eq(schema.swipeSessions.id, sessionId)).get()!;

    const participants = db.select({
      userId: schema.swipeSessionParticipants.userId,
      username: schema.users.username,
      avatarUrl: schema.users.avatarUrl,
      joinedAt: schema.swipeSessionParticipants.joinedAt,
    }).from(schema.swipeSessionParticipants)
      .innerJoin(schema.users, eq(schema.swipeSessionParticipants.userId, schema.users.id))
      .where(eq(schema.swipeSessionParticipants.sessionId, sessionId))
      .all();

    const myLikes = db.select().from(schema.swipeSessionLikes)
      .where(and(eq(schema.swipeSessionLikes.sessionId, sessionId), eq(schema.swipeSessionLikes.userId, userId)))
      .all();

    const deckIds: number[] = JSON.parse(session.deckRecipeIds);

    let matchedRecipeName: string | null = null;
    if (session.matchedRecipeId) {
      const recipe = db.select().from(schema.recipes).where(eq(schema.recipes.id, session.matchedRecipeId)).get();
      matchedRecipeName = recipe?.name || null;
    }

    return {
      id: session.id, groupId: session.groupId, status: session.status,
      createdAt: session.createdAt, completedAt: session.completedAt,
      deck: hydrateDeck(deckIds), participants,
      myLikedRecipeIds: myLikes.map(l => l.recipeId),
      matchedRecipeId: session.matchedRecipeId,
      matchedRecipeName,
      shoppingListId: session.shoppingListId,
    };
  }

  app.post('/api/groups/:id/swipe-sessions', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };
    const groupId = Number(id);

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, groupId), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro de este grupo', statusCode: 403 });

    const recipes = db.select({ id: schema.recipes.id }).from(schema.recipes).all();
    if (recipes.length === 0) return reply.status(400).send({ message: 'No hay recetas disponibles', statusCode: 400 });

    const session = db.insert(schema.swipeSessions).values({
      groupId, createdBy: userId,
      deckRecipeIds: JSON.stringify(recipes.map(r => r.id)),
      status: 'active',
    }).returning().get();

    db.insert(schema.swipeSessionParticipants).values({ sessionId: session.id, userId }).run();

    return { id: session.id, groupId: session.groupId, status: session.status, createdAt: session.createdAt };
  });

  app.post('/api/swipe-sessions/:sessionId/join', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { sessionId } = request.params as { sessionId: string };

    const session = db.select().from(schema.swipeSessions).where(eq(schema.swipeSessions.id, Number(sessionId))).get();
    if (!session) return reply.status(404).send({ message: 'Sesión no encontrada', statusCode: 404 });

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, session.groupId), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro de este grupo', statusCode: 403 });

    if (session.status !== 'active') return reply.status(400).send({ message: 'La sesión ya finalizó', statusCode: 400 });

    const existing = db.select().from(schema.swipeSessionParticipants)
      .where(and(eq(schema.swipeSessionParticipants.sessionId, session.id), eq(schema.swipeSessionParticipants.userId, userId)))
      .get();
    if (!existing) {
      db.insert(schema.swipeSessionParticipants).values({ sessionId: session.id, userId }).run();
    }

    return buildStatus(session.id, userId);
  });

  app.get('/api/swipe-sessions/:sessionId', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { sessionId } = request.params as { sessionId: string };

    const session = db.select().from(schema.swipeSessions).where(eq(schema.swipeSessions.id, Number(sessionId))).get();
    if (!session) return reply.status(404).send({ message: 'Sesión no encontrada', statusCode: 404 });

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, session.groupId), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro de este grupo', statusCode: 403 });

    return buildStatus(session.id, userId);
  });

  app.post('/api/swipe-sessions/:sessionId/likes', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { sessionId } = request.params as { sessionId: string };

    const parsed = submitSwipeLikeSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });

    const session = db.select().from(schema.swipeSessions).where(eq(schema.swipeSessions.id, Number(sessionId))).get();
    if (!session) return reply.status(404).send({ message: 'Sesión no encontrada', statusCode: 404 });

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, session.groupId), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro de este grupo', statusCode: 403 });

    if (session.status !== 'active') return reply.status(400).send({ message: 'La sesión ya finalizó', statusCode: 400 });

    const participant = db.select().from(schema.swipeSessionParticipants)
      .where(and(eq(schema.swipeSessionParticipants.sessionId, session.id), eq(schema.swipeSessionParticipants.userId, userId)))
      .get();
    if (!participant) return reply.status(403).send({ message: 'Primero debes unirte a la sesión', statusCode: 403 });

    const deckIds: number[] = JSON.parse(session.deckRecipeIds);
    const { recipeId } = parsed.data;
    if (!deckIds.includes(recipeId)) return reply.status(400).send({ message: 'Receta fuera del mazo', statusCode: 400 });

    const existingLike = db.select().from(schema.swipeSessionLikes)
      .where(and(
        eq(schema.swipeSessionLikes.sessionId, session.id),
        eq(schema.swipeSessionLikes.userId, userId),
        eq(schema.swipeSessionLikes.recipeId, recipeId),
      )).get();
    if (!existingLike) {
      db.insert(schema.swipeSessionLikes).values({ sessionId: session.id, userId, recipeId }).run();
    }

    const participantCount = db.select().from(schema.swipeSessionParticipants)
      .where(eq(schema.swipeSessionParticipants.sessionId, session.id)).all().length;
    const likers = db.select().from(schema.swipeSessionLikes)
      .where(and(eq(schema.swipeSessionLikes.sessionId, session.id), eq(schema.swipeSessionLikes.recipeId, recipeId)))
      .all();
    const likeCount = new Set(likers.map(l => l.userId)).size;

    if (participantCount > 0 && likeCount >= participantCount) {
      const shoppingListId = generateShoppingListFromRecipe(session.groupId, session.createdBy, recipeId);
      db.update(schema.swipeSessions).set({
        status: 'completed', matchedRecipeId: recipeId, shoppingListId,
        completedAt: new Date().toISOString(),
      }).where(eq(schema.swipeSessions.id, session.id)).run();

      const recipe = db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).get();
      return { matched: true, matchedRecipeId: recipeId, matchedRecipeName: recipe?.name, shoppingListId };
    }

    return { matched: false };
  });
}
