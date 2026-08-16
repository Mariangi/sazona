import { GoogleGenAI } from '@google/genai';
import { recognizeIngredientsResponseSchema } from '@sasona/shared';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const TIMEOUT_MS = 45_000;

const PROMPT = `Mirá esta foto de una heladera o alacena y listá los alimentos e ingredientes individuales que puedas distinguir (frutas, verduras, lácteos, carnes, condimentos, envasados, etc). Usá nombres simples en español, sin marcas ni cantidades. Devolvé únicamente un JSON con la forma { "ingredients": string[] }. Si no reconocés ningún alimento, devolvé { "ingredients": [] }.`;

class GeminiNotConfiguredError extends Error {}
class GeminiRecognitionError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiNotConfiguredError('GEMINI_API_KEY no configurada');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new GeminiRecognitionError('Timeout')), ms)),
  ]);
}

export async function recognizeIngredientsFromImage(base64Data: string, mimeType: string): Promise<string[]> {
  const ai = getClient();

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType, data: base64Data } },
        PROMPT,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            ingredients: { type: 'array', items: { type: 'string' } },
          },
          required: ['ingredients'],
        },
      },
    }),
    TIMEOUT_MS
  );

  const text = response.text;
  if (!text) {
    throw new GeminiRecognitionError('Respuesta vacía de Gemini');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiRecognitionError('Respuesta de Gemini no es JSON válido');
  }

  const result = recognizeIngredientsResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiRecognitionError('Respuesta de Gemini con formato inesperado');
  }

  const seen = new Set<string>();
  const ingredients: string[] = [];
  for (const raw of result.data.ingredients) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ingredients.push(normalized);
  }

  return ingredients;
}

export { GeminiNotConfiguredError, GeminiRecognitionError };
