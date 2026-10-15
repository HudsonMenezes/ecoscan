type Env = Record<string, string | undefined>;

export type ApiErrorCode =
  | 'forbidden_origin'
  | 'method_not_allowed'
  | 'invalid_image'
  | 'image_too_large'
  | 'invalid_text'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'ai_timeout'
  | 'tts_unavailable';

export function jsonError(status: number, error: ApiErrorCode): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Origens aceitas: ALLOWED_ORIGIN (lista separada por vírgula) + a URL do próprio
 * deploy (VERCEL_URL), para os deploys de preview funcionarem sem configuração extra.
 */
export function allowedOrigins(env: Env = process.env): Set<string> {
  const origins = (env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (env.VERCEL_URL) origins.push(`https://${env.VERCEL_URL}`);
  return new Set(origins);
}

/**
 * Barreira contra uso casual do endpoint (curl, outros sites). Não é autenticação:
 * o header Origin pode ser forjado fora do navegador.
 */
export function checkOrigin(
  request: Request,
  env: Env = process.env,
): { ok: true } | { ok: false; response: Response } {
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins(env).has(origin)) return { ok: true };
  return { ok: false, response: jsonError(403, 'forbidden_origin') };
}
