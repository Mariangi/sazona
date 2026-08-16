import Fastify from 'fastify';
import cors from '@fastify/cors';
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

const app = Fastify({ logger: true, bodyLimit: 15 * 1024 * 1024 });

await app.register(cors, {
  origin: true,
  credentials: true,
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

if (existsSync(DIST_DIR)) {
  await app.register(fastifyStatic, {
    root: DIST_DIR,
    prefix: '/',
    decorateReply: false,
  });

  app.setNotFoundHandler((_request, reply) => {
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
