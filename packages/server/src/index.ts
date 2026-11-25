import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { authRoutes } from './routes/auth.js';
import { recipeRoutes } from './routes/recipes.js';
import { groupRoutes } from './routes/groups.js';
import { mealPlanRoutes } from './routes/mealPlans.js';
import { swipeSessionRoutes } from './routes/swipeSessions.js';
import { ingredientRecognitionRoutes } from './routes/ingredientRecognition.js';
import { nutritionRoutes } from './routes/nutrition.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'uploads');
const DIST_DIR = join(__dirname, '..', '..', '..', 'dist');
const ENV_FILE = join(__dirname, '..', '.env');

if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cantidad de proxies de confianza delante del servidor (Funnel/Traefik) para leer la IP real.
// TRUST_PROXY: número de saltos (default 2), "true"/"false", o una lista de IPs/CIDR.
function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (value === undefined || value.trim() === '') return 2;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  return Number.isInteger(n) ? n : value;
}

const app = Fastify({
  logger: true,
  bodyLimit: 15 * 1024 * 1024,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
});

// CORS_ORIGINS: lista separada por comas (ej. "https://localhost,http://localhost,capacitor://localhost").
// Sin definir se refleja cualquier origen. La app autentica con Bearer token (sin cookies),
// por eso no se habilitan credenciales.
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: corsOrigins.length > 0 ? corsOrigins : true,
});

// Límite general por IP; las rutas sensibles (registro, login, Gemini) definen uno más estricto.
await app.register(rateLimit, {
  global: true,
  max: 600,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    statusCode: 429,
    message: `Demasiadas solicitudes, intentá de nuevo en ${context.after}`,
  }),
});

await app.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: '/uploads/',
  decorateReply: false,
});

authRoutes(app);
recipeRoutes(app);
groupRoutes(app);
mealPlanRoutes(app);
swipeSessionRoutes(app);
ingredientRecognitionRoutes(app);
nutritionRoutes(app);

if (existsSync(DIST_DIR)) {
  await app.register(fastifyStatic, {
    root: DIST_DIR,
    prefix: '/',
    decorateReply: false,
  });

  app.setNotFoundHandler((request, reply) => {
    // API y archivos subidos inexistentes: 404 real, no el HTML de la app.
    const path = request.url.split('?')[0];
    const isApiOrUpload = path.startsWith('/api/') || path.startsWith('/uploads/');
    if (isApiOrUpload || (request.method !== 'GET' && request.method !== 'HEAD')) {
      reply.status(404).send({ message: 'Not found', statusCode: 404 });
      return;
    }
    try {
      const html = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');
      reply.type('text/html').send(html);
    } catch {
      reply.status(404).send({ message: 'Not found', statusCode: 404 });
    }
  });

  console.log('Frontend build detectado, sirviendo archivos estáticos');
} else {
  console.log('Modo desarrollo: no se sirve frontend estático');
}

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
