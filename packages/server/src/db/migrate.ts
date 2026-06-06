import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = new URL('../../data/sasona.db', import.meta.url).pathname;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });

console.log('Migraciones ejecutadas correctamente');
sqlite.close();
