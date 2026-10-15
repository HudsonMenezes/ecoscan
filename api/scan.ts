/** POST /api/scan: foto (JPEG em base64) → ScanResult com as regras de confiança aplicadas. */
import { z } from 'zod';
import {
  applyConfidenceRules,
  ScanResultSchema,
  type ScanResult,
} from '../src/shared/contracts/index.js';
import { checkOrigin, jsonError } from './_lib/http.js';
import { createOpenAIScanModel, InvalidModelOutputError, type ScanModel } from './_lib/openai.js';
import { PROMPT_VERSION } from './_lib/prompts/scan.js';

type Env = Record<string, string | undefined>;

export const MAX_IMAGE_BYTES = 1_000_000; // decodificado
// base64 cresce 4/3; a folga cobre o JSON em volta. Acima disso nem lemos o corpo.
const MAX_BODY_CHARS = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1_000;
export const AI_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2; // 1 retry quando a resposta da IA não passa no schema

const ScanRequestSchema = z.object({
  imageBase64: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

class TimeoutError extends Error {}

// `rejections`: por que cada tentativa falhou (campo e código, nunca o conteúdo).
type Outcome = { attempts: number; rejections: string[] } & (
  | { ok: true; result: ScanResult }
  | { ok: false; status: 502 | 504; error: 'ai_unavailable' | 'ai_timeout' }
);

async function identifyWaste(
  imageBase64: string,
  model: ScanModel,
  timeoutMs: number,
  now: () => number,
): Promise<Outcome> {
  const deadline = now() + timeoutMs;
  let attempts = 0;
  const rejections: string[] = [];

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    const remaining = deadline - now();
    if (remaining <= 0)
      return { ok: false, status: 504, error: 'ai_timeout', attempts, rejections };

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const raw = await Promise.race([
        model(imageBase64, controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new TimeoutError());
          }, remaining);
        }),
      ]);
      const parsed = ScanResultSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return { ok: true, result: parsed.data, attempts, rejections };
      // Schema inválido: tenta de novo.
      rejections.push(
        ...parsed.error.issues.map((issue) => `schema:${issue.path.join('.')}:${issue.code}`),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        return { ok: false, status: 504, error: 'ai_timeout', attempts, rejections };
      }
      // JSON quebrado ou resposta inutilizável: tenta de novo. Erro da API: desiste.
      if (error instanceof SyntaxError) {
        rejections.push('json');
      } else if (error instanceof InvalidModelOutputError) {
        rejections.push(`output:${error.message}`);
      } else {
        rejections.push(`api:${error instanceof Error ? error.name : 'unknown'}`);
        return { ok: false, status: 502, error: 'ai_unavailable', attempts, rejections };
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 502, error: 'ai_unavailable', attempts, rejections };
}

function isJpeg(imageBase64: string) {
  const head = Buffer.from(imageBase64.slice(0, 8), 'base64');
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
}

function decodedLength(imageBase64: string) {
  const padding = imageBase64.endsWith('==') ? 2 : imageBase64.endsWith('=') ? 1 : 0;
  return (imageBase64.length * 3) / 4 - padding;
}

export function createScanHandler({
  model,
  env = process.env,
  now = Date.now,
  timeoutMs = AI_TIMEOUT_MS,
  log = (entry: Record<string, unknown>) => console.log(JSON.stringify(entry)),
}: {
  model: () => ScanModel;
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
    if (declared > MAX_BODY_CHARS) return jsonError(413, 'image_too_large');
    const text = await request.text().catch(() => '');
    if (text.length > MAX_BODY_CHARS) return jsonError(413, 'image_too_large');

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return jsonError(400, 'invalid_image');
    }
    const body = ScanRequestSchema.safeParse(json);
    if (!body.success) return jsonError(400, 'invalid_image');
    const { imageBase64 } = body.data;
    if (decodedLength(imageBase64) > MAX_IMAGE_BYTES) return jsonError(413, 'image_too_large');
    if (!isJpeg(imageBase64)) return jsonError(400, 'invalid_image');

    const started = now();
    const outcome = await identifyWaste(imageBase64, model(), timeoutMs, now);
    const latencyMs = now() - started;

    // Log sem imagem e sem texto da IA: só o necessário para operar (SPEC, LGPD).
    if (!outcome.ok) {
      log({
        event: 'scan',
        status: outcome.status,
        error: outcome.error,
        latencyMs,
        attempts: outcome.attempts,
        rejections: outcome.rejections,
        promptVersion: PROMPT_VERSION,
      });
      return jsonError(outcome.status, outcome.error);
    }

    const result = applyConfidenceRules(outcome.result);
    log({
      event: 'scan',
      status: 200,
      category: result.category,
      confidence: result.confidence,
      latencyMs,
      attempts: outcome.attempts,
      rejections: outcome.rejections,
      promptVersion: PROMPT_VERSION,
    });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  };
}

let realModel: ScanModel | undefined;

export default {
  fetch: createScanHandler({ model: () => (realModel ??= createOpenAIScanModel()) }),
};
