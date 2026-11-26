import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from '@google/genai';

// El modelo principal suele responder 503 por alta demanda: en ese caso se prueba con los de respaldo.
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.1-flash-lite,gemini-flash-lite-latest')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
// El principal tiene poca espera para pasar rápido al respaldo; los de respaldo, más margen.
const PRIMARY_TIMEOUT_MS = 10_000;
const FALLBACK_TIMEOUT_MS = 20_000;

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

/** Con otro modelo puede andar: saturación, cuota, error interno, modelo retirado o tiempo agotado. */
function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  if (status === undefined) return true;
  return status === 404 || status === 429 || status >= 500;
}

export async function generateWithFallback(
  params: Omit<GenerateContentParameters, 'model'>,
): Promise<GenerateContentResponse> {
  const ai = getClient();
  const failures: string[] = [];

  for (const model of new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])) {
    const timeout = model === PRIMARY_MODEL ? PRIMARY_TIMEOUT_MS : FALLBACK_TIMEOUT_MS;
    try {
      return await ai.models.generateContent({
        ...params,
        model,
        config: { ...params.config, abortSignal: AbortSignal.timeout(timeout) },
      });
    } catch (err) {
      failures.push(`${model}: ${(err as { status?: number }).status ?? (err as Error).name}`);
      if (!isRetryable(err)) break;
    }
  }

  throw new GeminiRecognitionError(`Gemini no respondió (${failures.join(', ')})`);
}

export { GeminiNotConfiguredError, GeminiRecognitionError };
