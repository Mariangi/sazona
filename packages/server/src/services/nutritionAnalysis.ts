import { analyzeMealResponseSchema } from '@sasona/shared';
import { generateWithFallback, GeminiNotConfiguredError, GeminiRecognitionError } from './geminiClient.js';

const PROMPT = `Mirá esta foto de un plato de comida y estimá sus valores nutricionales. Devolvé únicamente un JSON con la forma { "foodName": string, "servingDescription": string, "calories": number, "protein": number, "fat": number, "carbs": number }. "foodName" es el nombre simple del plato en español, "servingDescription" describe brevemente la porción que ves (ej. "1 plato mediano"), "calories" son las calorías totales estimadas, y "protein", "fat" y "carbs" son gramos estimados de proteínas, grasas y carbohidratos respectivamente. Son valores aproximados a partir de una foto, no una medición exacta de laboratorio — hacé tu mejor estimación igual.`;

export interface MealAnalysis {
  foodName: string;
  servingDescription: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export async function analyzeMealFromImage(base64Data: string, mimeType: string): Promise<MealAnalysis> {
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

  const result = analyzeMealResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiRecognitionError('Respuesta de Gemini con formato inesperado');
  }

  return result.data;
}

export { GeminiNotConfiguredError, GeminiRecognitionError };
