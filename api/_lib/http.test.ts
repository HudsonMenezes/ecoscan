// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { allowedOrigins, checkOrigin, jsonError } from './http.js';

const env = { ALLOWED_ORIGIN: 'https://ecoscan-v1.vercel.app, https://localhost:5173/' };

function requestFrom(origin?: string) {
  return new Request('https://ecoscan-v1.vercel.app/api/scan', {
    method: 'POST',
    headers: origin ? { origin } : {},
  });
}

describe('allowedOrigins', () => {
  it('aceita lista separada por vírgula, sem espaços nem barra final', () => {
    expect(allowedOrigins(env)).toEqual(
      new Set(['https://ecoscan-v1.vercel.app', 'https://localhost:5173']),
    );
  });

  it('inclui a URL do deploy de preview (VERCEL_URL)', () => {
    expect(allowedOrigins({ VERCEL_URL: 'ecoscan-abc123.vercel.app' })).toContain(
      'https://ecoscan-abc123.vercel.app',
    );
  });

  it('fica vazia sem configuração', () => {
    expect(allowedOrigins({}).size).toBe(0);
  });
});

describe('checkOrigin', () => {
  it('libera origem permitida', () => {
    expect(checkOrigin(requestFrom('https://ecoscan-v1.vercel.app'), env)).toEqual({ ok: true });
  });

  it.each([
    ['outro site', 'https://site-malicioso.com'],
    ['sem header Origin (ex.: curl)', undefined],
  ])('bloqueia %s com 403', async (_, origin) => {
    const result = checkOrigin(requestFrom(origin), env);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({ error: 'forbidden_origin' });
  });
});

describe('jsonError', () => {
  it('devolve JSON com o código e sem cache', async () => {
    const response = jsonError(413, 'image_too_large');
    expect(response.status).toBe(413);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'image_too_large' });
  });
});
