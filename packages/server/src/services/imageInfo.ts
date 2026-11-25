import { existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { thumbName, UPLOADS_DIR } from './images.js';

type Size = { width: number; height: number };

// Los archivos de uploads no cambian bajo el mismo nombre: las dimensiones se cachean para siempre.
const sizeCache = new Map<string, Size>();

async function readSize(filename: string): Promise<Size | null> {
  const cached = sizeCache.get(filename);
  if (cached) return cached;
  try {
    const { width, height, orientation = 1 } = await sharp(join(UPLOADS_DIR, filename)).metadata();
    if (!width || !height) return null;
    // Las orientaciones EXIF 5-8 giran 90°: el navegador muestra ancho y alto invertidos.
    const size = orientation >= 5 ? { width: height, height: width } : { width, height };
    sizeCache.set(filename, size);
    return size;
  } catch {
    return null;
  }
}

/**
 * Recorre la respuesta y, en cada objeto con `imageUrl` de uploads/, agrega `imageWidth` e
 * `imageHeight` (para reservar el espacio antes de que la imagen cargue) e `imageThumbUrl`
 * si existe la miniatura.
 */
export async function attachImageInfo(value: unknown): Promise<void> {
  if (Array.isArray(value)) {
    await Promise.all(value.map(attachImageInfo));
    return;
  }
  if (value === null || typeof value !== 'object') return;

  const obj = value as Record<string, unknown>;
  await Promise.all(Object.values(obj).map(attachImageInfo));

  const url = obj.imageUrl;
  if (typeof url !== 'string') return;
  const match = url.match(/^\/uploads\/([\w-][\w.-]*)$/);
  if (!match) return;
  const filename = match[1];

  const size = await readSize(filename);
  if (size) {
    obj.imageWidth = size.width;
    obj.imageHeight = size.height;
  }
  const thumb = thumbName(filename);
  if (existsSync(join(UPLOADS_DIR, thumb))) obj.imageThumbUrl = `/uploads/${thumb}`;
}
