import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';

const dbPath = new URL('../../data/sasona.db', import.meta.url).pathname;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  db.insert(schema.users).values({
    email: 'admin@sasona.app',
    username: 'admin',
    passwordHash: hash,
  }).run();
  console.log('Usuario admin creado: admin@sasona.app / admin123');
  sqlite.close();
}

seed();
