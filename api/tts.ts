/** POST /api/tts: texto do app → áudio MP3 (reserva quando o aparelho não tem voz pt-BR). */
import { z } from 'zod';
import { firstInvalidChar } from '../src/shared/contracts/index.js';
import { checkOrigin, jsonError } from './_lib/http.js';
import { createOpenAITtsModel, type TtsModel } from './_lib/tts.js';

type Env = Record<string, string | undefined>;

export const MAX_TEXT_CHARS = 600;
// O JSON em volta e os escapes de acentos (é) cabem com folga.
const MAX_BODY_CHARS = MAX_TEXT_CHARS * 6 + 200;
export const TTS_TIMEOUT_MS = 10_000; // até o início do áudio

// Só escrita latina (como os textos do app): o endpoint não é um TTS genérico.
const TtsRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TEXT_CHARS)
    .refine((text) => firstInvalidChar(text) === null),
});

class TimeoutError extends Error {}

export function createTtsHandler({
  model,
  env = process.env,
  now = Date.now,
  timeoutMs = TTS_TIMEOUT_MS,
  log = (entry: Record<string, unknown>) => console.log(JSON.stringify(entry)),
}: {
  model: () => TtsModel;
  env?: Env;
  now?: () => number;
  timeoutMs?: number;
  log?: (entry: Record<string, unknown>) => void;
}) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== 'POST') return jsonError(405, 'method_not_allowed');

    const origin = checkOrigin(request, env);
    if (!origin.ok) return origin.response;

    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > MAX_BODY_CHARS) return jsonError(400, 'invalid_text');
    const raw = await request.text().catch(() => '');
    if (raw.length > MAX_BODY_CHARS) return jsonError(400, 'invalid_text');

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return jsonError(400, 'invalid_text');
    }
    const body = TtsRequestSchema.safeParse(json);
    if (!body.success) return jsonError(400, 'invalid_text');
    const { text } = body.data;

    const started = now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const audio = await Promise.race([
        model()(text, controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new TimeoutError());
          }, timeoutMs);
        }),
      ]);
      // Log sem o texto: só o tamanho e o tempo até o início do áudio.
      log({ event: 'tts', status: 200, chars: text.length, latencyMs: now() - started });
      return new Response(audio, {
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      const reason = error instanceof TimeoutError ? 'timeout' : `api:${(error as Error)?.name}`;
      log({ event: 'tts', status: 502, reason, chars: text.length, latencyMs: now() - started });
      return jsonError(502, 'tts_unavailable');
    } finally {
      clearTimeout(timer);
    }
  };
}

let realModel: TtsModel | undefined;

export default {
  fetch: createTtsHandler({ model: () => (realModel ??= createOpenAITtsModel()) }),
};
