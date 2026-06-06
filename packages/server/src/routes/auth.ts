import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, schema } from '../db/index.js';
import { eq, ne } from 'drizzle-orm';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, avatarSchema } from '@sasona/shared';
import { signToken } from '../auth/jwt.js';
import { authMiddleware } from '../auth/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

export function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0].message,
        statusCode: 400,
      });
    }

    const { email, username, password } = parsed.data;

    const existingEmail = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (existingEmail) {
      return reply.status(409).send({ message: 'Email ya registrado', statusCode: 409 });
    }

    const existingUsername = db.select().from(schema.users).where(eq(schema.users.username, username)).get();
    if (existingUsername) {
      return reply.status(409).send({ message: 'Nombre de usuario ya en uso', statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.insert(schema.users).values({ email, username, passwordHash }).returning().get();

    const token = signToken({ userId: result.id, email: result.email });

    return {
      user: {
        id: result.id,
        email: result.email,
        username: result.username,
        avatarUrl: result.avatarUrl,
        createdAt: result.createdAt,
      },
      token,
    };
  });

  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0].message,
        statusCode: 400,
      });
    }

    const { email, password } = parsed.data;

    const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (!user) {
      return reply.status(401).send({ message: 'Email o contraseña incorrectos', statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ message: 'Email o contraseña incorrectos', statusCode: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  });

  app.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;
    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) {
      return { message: 'Usuario no encontrado', statusCode: 404 };
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  });

  app.put('/api/auth/profile', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });
    }

    const { userId } = (request as any).user;
    const { email, username } = parsed.data;

    const emailExists = db.select().from(schema.users)
      .where(eq(schema.users.email, email))
      .all()
      .find(u => u.id !== userId);
    if (emailExists) {
      return reply.status(409).send({ message: 'Email ya registrado', statusCode: 409 });
    }

    const usernameExists = db.select().from(schema.users)
      .where(eq(schema.users.username, username))
      .all()
      .find(u => u.id !== userId);
    if (usernameExists) {
      return reply.status(409).send({ message: 'Nombre de usuario ya en uso', statusCode: 409 });
    }

    db.update(schema.users)
      .set({ email, username })
      .where(eq(schema.users.id, userId))
      .run();

    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()!;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  });

  app.put('/api/auth/password', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0].message, statusCode: 400 });
    }

    const { userId } = (request as any).user;
    const { currentPassword, newPassword } = parsed.data;

    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) {
      return reply.status(404).send({ message: 'Usuario no encontrado', statusCode: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ message: 'Contraseña actual incorrecta', statusCode: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, userId))
      .run();

    return { message: 'Contraseña actualizada correctamente' };
  });

  app.post('/api/auth/avatar', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = avatarSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Imagen inválida', statusCode: 400 });
    }

    const { userId } = (request as any).user;
    const { avatarBase64 } = parsed.data;

    const matches = avatarBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return reply.status(400).send({ message: 'Formato de imagen inválido', statusCode: 400 });
    }

    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `avatar-${userId}-${randomUUID()}.${ext}`;
    const filepath = join(UPLOADS_DIR, filename);

    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    await writeFile(filepath, buffer);
    const avatarUrl = `/uploads/${filename}`;

    db.update(schema.users)
      .set({ avatarUrl })
      .where(eq(schema.users.id, userId))
      .run();

    return { avatarUrl };
  });
}
