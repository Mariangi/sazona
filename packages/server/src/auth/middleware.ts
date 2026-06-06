import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.status(401).send({ message: 'Token requerido', statusCode: 401 });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (request as any).user = payload;
  } catch {
    reply.status(401).send({ message: 'Token inválido o expirado', statusCode: 401 });
  }
}
