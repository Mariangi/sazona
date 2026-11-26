import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // Hay que devolver reply: con hooks asíncronos en el envío (preSerialization), si no se
    // devuelve, Fastify igual ejecuta la ruta y el proceso muere por escribir dos veces.
    return reply.status(401).send({ message: 'Token requerido', statusCode: 401 });
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (request as any).user = payload;
  } catch {
    return reply.status(401).send({ message: 'Token inválido o expirado', statusCode: 401 });
  }
}
