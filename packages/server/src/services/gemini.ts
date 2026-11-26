import { recognizeIngredientsResponseSchema } from '@sasona/shared';
import { generateWithFallback, GeminiNotConfiguredError, GeminiRecognitionError } from './geminiClient.js';

const PROMPT = `Mirá esta foto de una heladera o alacena y listá los alimentos e ingredientes individuales que puedas distinguir (frutas, verduras, lácteos, carnes, condimentos, envasados, etc). Usá nombres simples en español, sin marcas ni cantidades. Devolvé únicamente un JSON con la forma { "ingredients": string[] }. Si no reconocés ningún alimento, devolvé { "ingredients": [] }.`;

export async function recognizeIngredientsFromImage(base64Data: string, mimeType: string): Promise<string[]> {
  const response = await generateWithFallback({
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
  });

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
