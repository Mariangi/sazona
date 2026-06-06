import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import {
  createGroupSchema, joinGroupSchema, createMessageSchema,
  castVoteSchema, createShoppingListSchema,
} from '@sasona/shared';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';

export function groupRoutes(app: FastifyInstance) {

  // ─── GROUPS ──────────────────────────────────────────────

  app.post('/api/groups', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = createGroupSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });

    const { userId } = (request as any).user;
    const { name } = parsed.data;
    const inviteCode = randomUUID().slice(0, 8).toUpperCase();

    const group = db.insert(schema.familyGroups).values({ name, inviteCode, createdBy: userId }).returning().get();
    db.insert(schema.familyMembers).values({ groupId: group.id, userId, role: 'admin' }).run();

    return { id: group.id, name: group.name, inviteCode: group.inviteCode, createdAt: group.createdAt };
  });

  app.post('/api/groups/join', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = joinGroupSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });

    const { userId } = (request as any).user;
    const { inviteCode } = parsed.data;

    const group = db.select().from(schema.familyGroups).where(eq(schema.familyGroups.inviteCode, inviteCode)).get();
    if (!group) return reply.status(404).send({ message: 'Código de invitación inválido', statusCode: 404 });

    const existing = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, group.id), eq(schema.familyMembers.userId, userId))).get();
    if (existing) return reply.status(409).send({ message: 'Ya eres miembro de este grupo', statusCode: 409 });

    db.insert(schema.familyMembers).values({ groupId: group.id, userId, role: 'member' }).run();
    return { id: group.id, name: group.name, inviteCode: group.inviteCode, createdAt: group.createdAt };
  });

  app.get('/api/groups', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const memberships = db.select().from(schema.familyMembers)
      .where(eq(schema.familyMembers.userId, userId)).all();

    if (memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.groupId);
    const groups = db.select().from(schema.familyGroups)
      .where(inArray(schema.familyGroups.id, groupIds)).all();

    const counts = db.select({
      groupId: schema.familyMembers.groupId,
      count: sql<number>`count(*)`,
    }).from(schema.familyMembers)
      .where(inArray(schema.familyMembers.groupId, groupIds))
      .groupBy(schema.familyMembers.groupId)
      .all();

    const countMap = new Map(counts.map(c => [c.groupId, c.count]));

    return groups.map(g => ({
      id: g.id, name: g.name, inviteCode: g.inviteCode,
      createdBy: g.createdBy, memberCount: countMap.get(g.id) || 0, createdAt: g.createdAt,
    }));
  });

  app.get('/api/groups/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const group = db.select().from(schema.familyGroups).where(eq(schema.familyGroups.id, Number(id))).get();
    if (!group) return reply.status(404).send({ message: 'Grupo no encontrado', statusCode: 404 });

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, group.id), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro de este grupo', statusCode: 403 });

    const members = db.select({
      id: schema.familyMembers.id,
      userId: schema.familyMembers.userId,
      username: schema.users.username,
      avatarUrl: schema.users.avatarUrl,
      role: schema.familyMembers.role,
    }).from(schema.familyMembers)
      .innerJoin(schema.users, eq(schema.familyMembers.userId, schema.users.id))
      .where(eq(schema.familyMembers.groupId, group.id))
      .all();

    const count = db.select({ count: sql<number>`count(*)` })
      .from(schema.familyMembers).where(eq(schema.familyMembers.groupId, group.id)).get();

    return {
      id: group.id, name: group.name, inviteCode: group.inviteCode,
      createdBy: group.createdBy, memberCount: count?.count || 0,
      members, createdAt: group.createdAt,
    };
  });

  // ─── MESSAGES / PROPOSALS ────────────────────────────────

  app.get('/api/groups/:id/messages', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, Number(id)), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro', statusCode: 403 });

    const messages = db.select({
      id: schema.groupMessages.id,
      groupId: schema.groupMessages.groupId,
      userId: schema.groupMessages.userId,
      username: schema.users.username,
      avatarUrl: schema.users.avatarUrl,
      recipeId: schema.groupMessages.recipeId,
      recipeName: schema.recipes.name,
      message: schema.groupMessages.message,
      status: schema.groupMessages.status,
      createdAt: schema.groupMessages.createdAt,
    }).from(schema.groupMessages)
      .innerJoin(schema.users, eq(schema.groupMessages.userId, schema.users.id))
      .leftJoin(schema.recipes, eq(schema.groupMessages.recipeId, schema.recipes.id))
      .where(eq(schema.groupMessages.groupId, Number(id)))
      .orderBy(desc(schema.groupMessages.createdAt))
      .all();

    const messageIds = messages.map(m => m.id);
    const votes = messageIds.length > 0
      ? db.select().from(schema.proposalVotes).where(inArray(schema.proposalVotes.messageId, messageIds)).all()
      : [];

    const voteMap = new Map<number, typeof votes>();
    for (const v of votes) {
      if (!voteMap.has(v.messageId)) voteMap.set(v.messageId, []);
      voteMap.get(v.messageId)!.push(v);
    }

    return messages.map(m => {
      const mv = voteMap.get(m.id) || [];
      return {
        id: m.id, groupId: m.groupId, userId: m.userId,
        username: m.username, avatarUrl: m.avatarUrl,
        recipeId: m.recipeId, recipeName: m.recipeName,
        message: m.message, status: m.status,
        votes: {
          si: mv.filter(v => v.vote === 'si').length,
          no: mv.filter(v => v.vote === 'no').length,
          tal_vez: mv.filter(v => v.vote === 'tal_vez').length,
        },
        userVote: mv.find(v => v.userId === userId)?.vote || null,
        createdAt: m.createdAt,
      };
    });
  });

  app.post('/api/groups/:id/messages', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = createMessageSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });

    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const membership = db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, Number(id)), eq(schema.familyMembers.userId, userId))).get();
    if (!membership) return reply.status(403).send({ message: 'No eres miembro', statusCode: 403 });

    const { message, recipeId } = parsed.data;

    const msg = db.insert(schema.groupMessages).values({
      groupId: Number(id), userId,
      message: message || null,
      recipeId: recipeId || null,
      status: recipeId ? 'voting' : 'active',
    }).returning().get();

    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    let recipeName: string | null = null;
    if (recipeId) {
      const r = db.select().from(schema.recipes).where(eq(schema.recipes.id, recipeId)).get();
      recipeName = r?.name || null;
    }

    return {
      id: msg.id, groupId: msg.groupId, userId: msg.userId,
      username: user!.username, avatarUrl: user!.avatarUrl,
      recipeId: msg.recipeId, recipeName,
      message: msg.message, status: msg.status,
      votes: { si: 0, no: 0, tal_vez: 0 }, userVote: null,
      createdAt: msg.createdAt,
    };
  });

  app.post('/api/messages/:id/vote', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = castVoteSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Voto inválido', statusCode: 400 });

    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const msg = db.select().from(schema.groupMessages).where(eq(schema.groupMessages.id, Number(id))).get();
    if (!msg) return reply.status(404).send({ message: 'Mensaje no encontrado', statusCode: 404 });
    if (msg.status !== 'voting') return reply.status(400).send({ message: 'Esta propuesta no está en votación', statusCode: 400 });

    const existing = db.select().from(schema.proposalVotes)
      .where(and(eq(schema.proposalVotes.messageId, msg.id), eq(schema.proposalVotes.userId, userId))).get();

    if (existing) {
      db.update(schema.proposalVotes).set({ vote: parsed.data.vote })
        .where(eq(schema.proposalVotes.id, existing.id)).run();
    } else {
      db.insert(schema.proposalVotes).values({ messageId: msg.id, userId, vote: parsed.data.vote }).run();
    }

    const votes = db.select().from(schema.proposalVotes).where(eq(schema.proposalVotes.messageId, msg.id)).all();
    return {
      si: votes.filter(v => v.vote === 'si').length,
      no: votes.filter(v => v.vote === 'no').length,
      tal_vez: votes.filter(v => v.vote === 'tal_vez').length,
      userVote: parsed.data.vote,
    };
  });

  app.post('/api/messages/:id/close-vote', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const msg = db.select().from(schema.groupMessages).where(eq(schema.groupMessages.id, Number(id))).get();
    if (!msg) return reply.status(404).send({ message: 'Mensaje no encontrado', statusCode: 404 });
    if (msg.status !== 'voting') return reply.status(400).send({ message: 'No hay votación activa', statusCode: 400 });

    const votes = db.select().from(schema.proposalVotes).where(eq(schema.proposalVotes.messageId, msg.id)).all();
    const si = votes.filter(v => v.vote === 'si').length;
    const no = votes.filter(v => v.vote === 'no').length;
    const totalVotes = votes.length;

    const accepted = totalVotes > 0 && si > no;

    db.update(schema.groupMessages).set({ status: accepted ? 'accepted' : 'active' })
      .where(eq(schema.groupMessages.id, msg.id)).run();

    if (accepted && msg.recipeId) {
      const recipe = db.select().from(schema.recipes).where(eq(schema.recipes.id, msg.recipeId)).get();
      const ingredients = db.select().from(schema.recipeIngredients)
        .where(eq(schema.recipeIngredients.recipeId, msg.recipeId)).all();

      const list = db.insert(schema.shoppingLists).values({
        groupId: msg.groupId, userId, name: recipe?.name || 'Lista de compras',
      }).returning().get();

      if (ingredients.length > 0) {
        db.insert(schema.shoppingListItems).values(
          ingredients.map((ing, i) => ({
            listId: list.id, name: ing.name,
            quantity: ing.quantity || null, unit: ing.unit || null,
            orderIndex: i,
          }))
        ).run();
      }

      return { accepted: true, shoppingListId: list.id, si, no, tal_vez: votes.filter(v => v.vote === 'tal_vez').length };
    }

    return { accepted: false, si, no, tal_vez: votes.filter(v => v.vote === 'tal_vez').length };
  });

  // ─── SHOPPING LISTS ──────────────────────────────────────

  app.get('/api/shopping-lists', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const memberships = db.select().from(schema.familyMembers)
      .where(eq(schema.familyMembers.userId, userId)).all();
    const groupIds = memberships.map(m => m.groupId);

    const myLists = db.select().from(schema.shoppingLists)
      .where(eq(schema.shoppingLists.userId, userId)).all();

    const groupLists = groupIds.length > 0
      ? db.select().from(schema.shoppingLists)
        .where(inArray(schema.shoppingLists.groupId, groupIds)).all()
      : [];

    const allLists = [...myLists, ...groupLists];
    const unique = new Map(allLists.map(l => [l.id, l]));
    const listIds = [...unique.keys()];

    if (listIds.length === 0) return [];

    const allItems = db.select().from(schema.shoppingListItems)
      .where(inArray(schema.shoppingListItems.listId, listIds)).all();

    const groupNameMap = new Map<number, string>();
    if (groupIds.length > 0) {
      const gs = db.select().from(schema.familyGroups)
        .where(inArray(schema.familyGroups.id, groupIds)).all();
      for (const g of gs) groupNameMap.set(g.id, g.name);
    }

    return [...unique.values()].map(l => {
      const items = allItems.filter(i => i.listId === l.id);
      return {
        id: l.id, groupId: l.groupId, userId: l.userId, name: l.name,
        groupName: l.groupId ? groupNameMap.get(l.groupId) || null : null,
        itemCount: items.length, checkedCount: items.filter(i => i.checked).length,
        createdAt: l.createdAt, updatedAt: l.updatedAt,
      };
    });
  });

  app.post('/api/shopping-lists', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = createShoppingListSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });

    const { userId } = (request as any).user;
    const { name, items } = parsed.data;

    const list = db.insert(schema.shoppingLists).values({ userId, name }).returning().get();

    if (items.length > 0) {
      db.insert(schema.shoppingListItems).values(
        items.map((item, i) => ({
          listId: list.id, name: item.name, quantity: item.quantity || null,
          unit: item.unit || null, orderIndex: i,
        }))
      ).run();
    }

    return { id: list.id, name: list.name, createdAt: list.createdAt };
  });

  app.get('/api/shopping-lists/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const list = db.select().from(schema.shoppingLists).where(eq(schema.shoppingLists.id, Number(id))).get();
    if (!list) return reply.status(404).send({ message: 'Lista no encontrada', statusCode: 404 });

    // check access
    const isOwner = list.userId === userId;
    const isGroupMember = list.groupId ? db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, list.groupId), eq(schema.familyMembers.userId, userId))).get() : null;
    if (!isOwner && !isGroupMember) return reply.status(403).send({ message: 'Sin acceso', statusCode: 403 });

    const items = db.select().from(schema.shoppingListItems)
      .where(eq(schema.shoppingListItems.listId, list.id))
      .orderBy(schema.shoppingListItems.orderIndex)
      .all();

    let groupName: string | null = null;
    if (list.groupId) {
      const g = db.select().from(schema.familyGroups).where(eq(schema.familyGroups.id, list.groupId)).get();
      groupName = g?.name || null;
    }

    return {
      id: list.id, groupId: list.groupId, userId: list.userId,
      name: list.name, groupName,
      items: items.map(i => ({
        id: i.id, listId: i.listId, name: i.name,
        quantity: i.quantity, unit: i.unit, checked: i.checked, orderIndex: i.orderIndex,
      })),
      createdAt: list.createdAt, updatedAt: list.updatedAt,
    };
  });

  app.patch('/api/shopping-list-items/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };
    const { checked } = request.body as { checked: boolean };

    const item = db.select().from(schema.shoppingListItems).where(eq(schema.shoppingListItems.id, Number(id))).get();
    if (!item) return reply.status(404).send({ message: 'Item no encontrado', statusCode: 404 });

    const list = db.select().from(schema.shoppingLists).where(eq(schema.shoppingLists.id, item.listId)).get();
    if (!list) return reply.status(404).send({ message: 'Lista no encontrada', statusCode: 404 });

    const isOwner = list.userId === userId;
    const isGroupMember = list.groupId ? db.select().from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.groupId, list.groupId), eq(schema.familyMembers.userId, userId))).get() : null;
    if (!isOwner && !isGroupMember) return reply.status(403).send({ message: 'Sin acceso', statusCode: 403 });

    db.update(schema.shoppingListItems).set({ checked })
      .where(eq(schema.shoppingListItems.id, item.id)).run();

    return { id: item.id, checked };
  });

  app.delete('/api/shopping-lists/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as { id: string };

    const list = db.select().from(schema.shoppingLists).where(eq(schema.shoppingLists.id, Number(id))).get();
    if (!list) return reply.status(404).send({ message: 'Lista no encontrada', statusCode: 404 });
    if (list.userId !== userId) return reply.status(403).send({ message: 'No eres el dueño', statusCode: 403 });

    db.delete(schema.shoppingListItems).where(eq(schema.shoppingListItems.listId, list.id)).run();
    db.delete(schema.shoppingLists).where(eq(schema.shoppingLists.id, list.id)).run();

    return { message: 'Lista eliminada' };
  });
}
