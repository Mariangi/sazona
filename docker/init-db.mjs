// Aplica los .sql de packages/server/drizzle en orden sobre la DB SQLite.
// El journal de drizzle está desactualizado (ver 0006+), así que no usamos migrate().
import Database from 'better-sqlite3';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const server = join(process.cwd(), 'packages', 'server');
const dataDir = join(server, 'data');
const migrationsDir = join(server, 'drizzle');
mkdirSync(dataDir, { recursive: true });
mkdirSync(join(server, 'uploads'), { recursive: true });

const db = new Database(join(dataDir, 'sasona.db'));
db.pragma('journal_mode = WAL');

const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

const tracked = db
  .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='_sazona_migrations'")
  .get();
db.exec('CREATE TABLE IF NOT EXISTS _sazona_migrations (name TEXT PRIMARY KEY)');
const mark = db.prepare('INSERT OR IGNORE INTO _sazona_migrations (name) VALUES (?)');

// DB preexistente sin tracker (p. ej. volumen con una DB vieja): se asume al día.
const hasUsers = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!tracked && hasUsers) {
  files.forEach((f) => mark.run(f));
  console.log('[init-db] DB existente sin tracker: migraciones marcadas como aplicadas');
}

const applied = new Set(db.prepare('SELECT name FROM _sazona_migrations').all().map((r) => r.name));
for (const f of files) {
  if (applied.has(f)) continue;
  console.log(`[init-db] aplicando ${f}`);
  db.transaction(() => {
    db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
    mark.run(f);
  })();
}
db.close();
console.log('[init-db] listo');
