import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { analyzeMealRequestSchema, createNutritionLogSchema } from '@sasona/shared';
import { analyzeMealFromImage, GeminiNotConfiguredError, GeminiRecognitionError } from '../services/nutritionAnalysis.js';
import { eq, desc, and } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

export function nutritionRoutes(app: FastifyInstance) {
  app.post('/api/nutrition/analyze', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = analyzeMealRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Datos inválidos', statusCode: 400 });
    }

    const matches = parsed.data.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return reply.status(400).send({ message: 'Formato de imagen inválido', statusCode: 400 });
    }
    const [, mimeType, base64Data] = matches;

    try {
      const analysis = await analyzeMealFromImage(base64Data, mimeType);
      return analysis;
    } catch (err) {
      if (err instanceof GeminiNotConfiguredError) {
        request.log.error(err, 'Gemini no configurado');
        return reply.status(500).send({ message: 'El análisis nutricional no está disponible', statusCode: 500 });
      }
      if (err instanceof GeminiRecognitionError) {
        request.log.warn(err, 'Fallo al analizar la comida');
        return reply.status(502).send({ message: 'No se pudo analizar la foto, intentá de nuevo', statusCode: 502 });
      }
      request.log.error(err, 'Error inesperado analizando comida');
      return reply.status(502).send({ message: 'No se pudo analizar la foto, intentá de nuevo', statusCode: 502 });
    }
  });

  app.get('/api/nutrition/logs', { preHandler: authMiddleware }, async (request) => {
    const { userId } = (request as any).user;

    const logs = db.select().from(schema.nutritionLogs)
      .where(eq(schema.nutritionLogs.userId, userId))
      .orderBy(desc(schema.nutritionLogs.createdAt))
      .all();

    return logs.map(log => ({
      id: log.id,
      imageUrl: log.imageUrl,
      foodName: log.foodName,
      servingDescription: log.servingDescription,
      calories: log.calories,
      protein: log.protein,
      fat: log.fat,
      carbs: log.carbs,
      createdAt: log.createdAt,
    }));
  });

  app.post('/api/nutrition/logs', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = createNutritionLogSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0].message,
        statusCode: 400,
      });
    }

    const { imageBase64, foodName, servingDescription, calories, protein, fat, carbs } = parsed.data;
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

    const log = db.insert(schema.nutritionLogs).values({
      userId,
      imageUrl,
      foodName,
      servingDescription: servingDescription || null,
      calories,
      protein,
      fat,
      carbs,
    }).returning().get();

    return {
      id: log.id,
      imageUrl: log.imageUrl,
      foodName: log.foodName,
      servingDescription: log.servingDescription,
      calories: log.calories,
      protein: log.protein,
      fat: log.fat,
      carbs: log.carbs,
      createdAt: log.createdAt,
    };
  });

  app.delete('/api/nutrition/logs/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { userId } = (request as any).user;
    const id = Number((request.params as { id: string }).id);

    const existing = db.select().from(schema.nutritionLogs)
      .where(and(eq(schema.nutritionLogs.id, id), eq(schema.nutritionLogs.userId, userId)))
      .get();

    if (!existing) {
      return reply.status(404).send({ message: 'Registro no encontrado', statusCode: 404 });
    }

    db.delete(schema.nutritionLogs).where(eq(schema.nutritionLogs.id, id)).run();

    return { message: 'Registro eliminado' };
  });
}
