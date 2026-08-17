import { GoogleGenAI } from '@google/genai';
import { analyzeMealResponseSchema } from '@sasona/shared';
import { GeminiNotConfiguredError, GeminiRecognitionError } from './gemini.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const TIMEOUT_MS = 45_000;

const PROMPT = `Mirá esta foto de un plato de comida y estimá sus valores nutricionales. Devolvé únicamente un JSON con la forma { "foodName": string, "servingDescription": string, "calories": number, "protein": number, "fat": number, "carbs": number }. "foodName" es el nombre simple del plato en español, "servingDescription" describe brevemente la porción que ves (ej. "1 plato mediano"), "calories" son las calorías totales estimadas, y "protein", "fat" y "carbs" son gramos estimados de proteínas, grasas y carbohidratos respectivamente. Son valores aproximados a partir de una foto, no una medición exacta de laboratorio — hacé tu mejor estimación igual.`;

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

export interface MealAnalysis {
  foodName: string;
  servingDescription: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function analyzeMealFromImage(base64Data: string, mimeType: string): Promise<MealAnalysis> {
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
            foodName: { type: 'string' },
            servingDescription: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            fat: { type: 'number' },
            carbs: { type: 'number' },
          },
          required: ['foodName', 'calories', 'protein', 'fat', 'carbs'],
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

  const result = analyzeMealResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiRecognitionError('Respuesta de Gemini con formato inesperado');
  }

  return result.data;
}

export { GeminiNotConfiguredError, GeminiRecognitionError };
