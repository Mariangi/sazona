import type { FastifyRequest } from 'fastify';
import { verifyToken } from './jwt.js';

// Clave por usuario (userId del JWT); si no hay token válido, por IP.
// Se decodifica acá porque el rate limit corre en onRequest, antes del authMiddleware.
export function userOrIpKey(request: FastifyRequest): string {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      return `u:${verifyToken(header.slice(7)).userId}`;
    } catch {
      // token inválido: cae a la IP
    }
  }
  return `ip:${request.ip}`;
}

// Límites por ruta (se pasan en `config` de la ruta). La clave por defecto es la IP.
export const registerLimit = { rateLimit: { max: 10, timeWindow: '1 hour' } };
export const loginLimit = { rateLimit: { max: 20, timeWindow: '15 minutes' } };
// Endpoints que consumen la cuota de Gemini: 30 por hora por usuario *y por endpoint*
// (cada ruta tiene su propio contador, así que el total máximo es 30 × cantidad de endpoints).
export const geminiLimit = { rateLimit: { max: 30, timeWindow: '1 hour', keyGenerator: userOrIpKey } };
