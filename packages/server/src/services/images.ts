import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

// Tamaño máximo (lado mayor, en px) y calidad WebP según el uso de la imagen.
export const IMAGE_PRESETS = {
  recipe: { maxSize: 1280, quality: 80 },
  meal: { maxSize: 1024, quality: 78 },
  avatar: { maxSize: 384, quality: 80 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

// Miniatura para las tarjetas de las grillas (los avatares ya son chicos y no la necesitan).
export const THUMB = { width: 640, maxHeight: 1280, quality: 75 } as const;

/** Nombre del archivo de miniatura asociado a una imagen: `abc.webp` -> `abc-thumb.webp`. */
export const thumbName = (filename: string) => `${basename(filename, extname(filename))}-thumb.webp`;

// Protege contra imágenes "bomba" (miles de megapíxeles que agotan la memoria).
const MAX_INPUT_PIXELS = 100_000_000;

/**
 * Corrige la orientación EXIF, achica la imagen a `maxSize` sin agrandarla, descarta los
 * metadatos (EXIF/GPS) y la convierte a WebP. Lanza si el buffer no es una imagen válida.
 */
export async function optimizeImage(input: Buffer, preset: ImagePreset): Promise<Buffer> {
  const { maxSize, quality } = IMAGE_PRESETS[preset];
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function createThumbnail(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: THUMB.width, height: THUMB.maxHeight, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB.quality, effort: 4 })
    .toBuffer();
}

/**
 * Recibe una imagen como data URI base64, la optimiza y la guarda en uploads/ como .webp.
 * Salvo los avatares, también guarda su miniatura.
 * Devuelve la URL pública (`/uploads/<archivo>`), o `null` si el formato no es una imagen válida.
 */
export async function saveImageFromDataUri(
  dataUri: string,
  preset: ImagePreset,
  filenamePrefix = '',
): Promise<string | null> {
  const matches = dataUri.match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/);
  if (!matches) return null;

  let optimized: Buffer;
  try {
    optimized = await optimizeImage(Buffer.from(matches[2], 'base64'), preset);
  } catch {
    return null;
  }

  const filename = `${filenamePrefix}${randomUUID()}.webp`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(join(UPLOADS_DIR, filename), optimized);
  if (preset !== 'avatar') {
    await writeFile(join(UPLOADS_DIR, thumbName(filename)), await createThumbnail(optimized));
  }
  return `/uploads/${filename}`;
}
