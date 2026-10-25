import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import { recognizeIngredientsRequestSchema } from '@sasona/shared';
import { recognizeIngredientsFromImage, GeminiNotConfiguredError, GeminiRecognitionError } from '../services/gemini.js';

export function ingredientRecognitionRoutes(app: FastifyInstance) {
  app.post('/api/recipes/recognize-ingredients', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = recognizeIngredientsRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Datos inválidos', statusCode: 400 });
    }

    const matches = parsed.data.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return reply.status(400).send({ message: 'Formato de imagen inválido', statusCode: 400 });
    }
    const [, mimeType, base64Data] = matches;

    try {
      const ingredients = await recognizeIngredientsFromImage(base64Data, mimeType);
      return { ingredients };
    } catch (err) {
      if (err instanceof GeminiNotConfiguredError) {
        request.log.error(err, 'Gemini no configurado');
        return reply.status(500).send({ message: 'El reconocimiento de imágenes no está disponible', statusCode: 500 });
      }
      if (err instanceof GeminiRecognitionError) {
        request.log.warn(err, 'Fallo al reconocer ingredientes');
        return reply.status(502).send({ message: 'No se pudo procesar la imagen, intentá de nuevo', statusCode: 502 });
      }
      request.log.error(err, 'Error inesperado reconociendo ingredientes');
      return reply.status(502).send({ message: 'No se pudo procesar la imagen, intentá de nuevo', statusCode: 502 });
    }
  });
}
