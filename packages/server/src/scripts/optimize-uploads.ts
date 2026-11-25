/**
 * Optimiza las imágenes que ya están en uploads/ (resize + WebP), actualiza las referencias
 * en la base de datos y genera las miniaturas que falten (recetas y comidas).
 * Los originales NO se borran: se mueven a una carpeta de backup.
 *
 *   npm run optimize:uploads -w packages/server -- --dry-run     # solo muestra qué haría
 *   npm run optimize:uploads -w packages/server                   # aplica los cambios
 *
 * Opciones:
 *   --dry-run          no escribe nada
 *   --db=RUTA          base SQLite (default: data/sasona.db)
 *   --uploads=RUTA     carpeta de imágenes (default: uploads)
 *   --backup=RUTA      destino de los originales (default: data/uploads-originals)
 *   --move-orphans     además mueve al backup las imágenes que ninguna fila referencia
 *
 * Es idempotente: las imágenes ya optimizadas se saltean. Orden de seguridad por imagen:
 * 1) escribe el archivo nuevo, 2) actualiza la base, 3) mueve el original al backup.
 */
import Database from 'better-sqlite3';
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createThumbnail, IMAGE_PRESETS, optimizeImage, thumbName, type ImagePreset } from '../services/images.js';

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: string) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? resolve(hit.slice(name.length + 3)) : fallback;
};

const dryRun = flag('dry-run');
const moveOrphans = flag('move-orphans');
const dbPath = option('db', join(serverDir, 'data', 'sasona.db'));
const uploadsDir = option('uploads', join(serverDir, 'uploads'));
const backupDir = option('backup', join(serverDir, 'data', 'uploads-originals'));

// Columnas que guardan una URL de imagen y el preset que les corresponde.
const REFS: { table: string; column: string; preset: ImagePreset }[] = [
  { table: 'users', column: 'avatar_url', preset: 'avatar' },
  { table: 'recipes', column: 'image_url', preset: 'recipe' },
  { table: 'nutrition_logs', column: 'image_url', preset: 'meal' },
];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tif', '.tiff']);

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;

/** Copia el archivo al backup y lo borra del origen (copy+unlink: sirve entre volúmenes distintos). */
function moveToBackup(file: string, subdir = '') {
  const dest = join(backupDir, subdir);
  mkdirSync(dest, { recursive: true });
  copyFileSync(file, join(dest, basename(file)));
  unlinkSync(file);
}

async function main() {
  if (!existsSync(dbPath)) throw new Error(`No existe la base de datos: ${dbPath}`);
  if (!existsSync(uploadsDir)) throw new Error(`No existe la carpeta de imágenes: ${uploadsDir}`);

  const db = new Database(dbPath, { readonly: dryRun });
  db.pragma('busy_timeout = 5000');

  const hasColumn = (table: string, column: string) =>
    (db.prepare(`pragma table_info("${table}")`).all() as { name: string }[]).some((c) => c.name === column);
  const refs = REFS.filter((r) => hasColumn(r.table, r.column));

  // nombre de archivo -> preset de mayor tamaño entre las columnas que lo referencian
  const presetByName = new Map<string, ImagePreset>();
  for (const { table, column, preset } of refs) {
    const rows = db
      .prepare(`select distinct "${column}" as u from "${table}" where "${column}" like '/uploads/%'`)
      .all() as { u: string }[];
    for (const { u } of rows) {
      const name = u.replace('/uploads/', '');
      const prev = presetByName.get(name);
      if (!prev || IMAGE_PRESETS[preset].maxSize > IMAGE_PRESETS[prev].maxSize) presetByName.set(name, preset);
    }
  }

  // Referencias en cualquier otra columna de texto: esas imágenes no se tocan.
  const knownCols = new Set(refs.map((r) => `${r.table}.${r.column}`));
  const otherRefs = new Map<string, string>();
  const tables = db.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%'").all() as { name: string }[];
  for (const { name: table } of tables) {
    const cols = db.prepare(`pragma table_info("${table}")`).all() as { name: string; type: string }[];
    for (const col of cols) {
      if (knownCols.has(`${table}.${col.name}`) || !/char|text|clob/i.test(col.type || 'text')) continue;
      const rows = db.prepare(`select "${col.name}" as v from "${table}" where "${col.name}" like '%/uploads/%'`).all() as { v: string }[];
      for (const { v } of rows) {
        for (const m of String(v).matchAll(/\/uploads\/([\w.\-]+)/g)) otherRefs.set(m[1], `${table}.${col.name}`);
      }
    }
  }

  const files = readdirSync(uploadsDir).filter(
    (f) => IMAGE_EXT.has(extname(f).toLowerCase()) && statSync(join(uploadsDir, f)).isFile(),
  );
  // Las miniaturas de imágenes referenciadas no son huérfanas aunque ninguna fila las nombre.
  const referencedThumbs = new Set(
    [...presetByName.keys()].flatMap((n) => [thumbName(n), thumbName(`${basename(n, extname(n))}.webp`)]),
  );
  const orphans = files.filter((f) => !presetByName.has(f) && !otherRefs.has(f) && !referencedThumbs.has(f));

  console.log(`${dryRun ? '[DRY-RUN] ' : ''}Base: ${dbPath}`);
  console.log(`Imágenes: ${files.length} en ${uploadsDir} | referenciadas: ${presetByName.size} | huérfanas: ${orphans.length}\n`);

  const updates = refs.map(({ table, column }) => ({
    table,
    column,
    stmt: dryRun ? null : db.prepare(`update "${table}" set "${column}" = ? where "${column}" = ?`),
  }));

  let thumbs = 0;

  /** Genera la miniatura si falta y pesa menos que la imagen (los avatares no llevan). */
  async function ensureThumb(filename: string, bytes: Buffer, preset: ImagePreset) {
    if (preset === 'avatar') return;
    const target = join(uploadsDir, thumbName(filename));
    if (existsSync(target)) return;
    const thumb = await createThumbnail(bytes);
    if (thumb.length >= bytes.length * 0.95) return;
    console.log(`  ${dryRun ? '~' : '+'} miniatura ${thumbName(filename)}  ${kb(thumb.length)}`);
    thumbs++;
    if (!dryRun) writeFileSync(target, thumb);
  }

  let before = 0;
  let after = 0;
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const [name, preset] of presetByName) {
    const file = join(uploadsDir, name);
    if (!existsSync(file)) {
      console.log(`  ! falta el archivo referenciado: ${name}`);
      failed++;
      continue;
    }

    const original = readFileSync(file);
    const ext = extname(name).toLowerCase();
    const { maxSize } = IMAGE_PRESETS[preset];

    let optimized: Buffer;
    let width = 0;
    let height = 0;
    let orientation = 1;
    try {
      const meta = await sharp(original).metadata();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
      orientation = meta.orientation ?? 1;
      optimized = await optimizeImage(original, preset);
    } catch (err) {
      console.log(`  ! no se pudo procesar ${name}: ${(err as Error).message}`);
      failed++;
      continue;
    }

    // Se saltea si ya es WebP dentro del tamaño máximo y sin rotación pendiente, o si el resultado
    // no pesa al menos un 5 % menos (nunca se reemplaza una imagen por otra más pesada).
    const fitsSize = Math.max(width, height) <= maxSize;
    const alreadyGood = ext === '.webp' && fitsSize && orientation === 1;
    const noGain = optimized.length >= original.length * 0.95;
    if (alreadyGood || noGain) {
      console.log(`  = ${name} (${kb(original.length)}) ya está optimizada`);
      skipped++;
      await ensureThumb(name, original, preset);
      continue;
    }

    const base = basename(name, extname(name));
    const newName = ext === '.webp' ? `${base}-o.webp` : `${base}.webp`;
    console.log(
      `  ${dryRun ? '~' : '+'} ${name}  ${width}x${height}  ${kb(original.length)} -> ${newName}  ${kb(optimized.length)}  (-${(100 - (optimized.length / original.length) * 100).toFixed(0)}%)`,
    );
    before += original.length;
    after += optimized.length;
    converted++;
    if (dryRun) {
      await ensureThumb(newName, optimized, preset);
      continue;
    }

    // 1) archivo nuevo, 2) referencias en la base, 3) original al backup
    writeFileSync(join(uploadsDir, newName), optimized);
    db.transaction(() => {
      for (const { stmt } of updates) stmt!.run(`/uploads/${newName}`, `/uploads/${name}`);
    })();
    moveToBackup(file);
    await ensureThumb(newName, optimized, preset);
  }

  if (moveOrphans && orphans.length > 0) {
    const bytes = orphans.reduce((a, f) => a + statSync(join(uploadsDir, f)).size, 0);
    console.log(`\n${dryRun ? '~' : '+'} ${orphans.length} huérfanas (${mb(bytes)}) -> ${join(backupDir, 'orphans')}`);
    if (!dryRun) for (const f of orphans) moveToBackup(join(uploadsDir, f), 'orphans');
  }

  const stillOther = [...otherRefs.keys()].filter((n) => presetByName.has(n) === false && files.includes(n));
  if (stillOther.length > 0) {
    console.log(`\nAviso: ${stillOther.length} imagen(es) referenciadas desde columnas desconocidas no se tocaron:`);
    for (const n of stillOther) console.log(`  ? ${n}  (${otherRefs.get(n)})`);
  }

  console.log(
    `\n${dryRun ? '[DRY-RUN] ' : ''}Convertidas: ${converted} | ya optimizadas: ${skipped} | miniaturas nuevas: ${thumbs} | con error/faltantes: ${failed} | huérfanas: ${orphans.length}${moveOrphans ? '' : ' (no se tocan; usar --move-orphans)'}`,
  );
  if (converted > 0) {
    console.log(`Peso de las convertidas: ${mb(before)} -> ${mb(after)}  (ahorro ${mb(before - after)}, -${(100 - (after / before) * 100).toFixed(0)}%)`);
  }
  if (!dryRun && converted > 0) console.log(`Originales en: ${backupDir}`);
  db.close();
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
