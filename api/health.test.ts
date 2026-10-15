// @vitest-environment node
import { describe, expect, it } from 'vitest';
import handler, { health } from './health.js';

describe('GET /api/health', () => {
  it('informa que a chave existe sem expor o valor', async () => {
    const response = health({ OPENAI_API_KEY: 'sk-segredo' });
    const body = await response.json();

    expect(body).toEqual({ ok: true, openaiKey: true });
    expect(JSON.stringify(body)).not.toContain('sk-');
  });

  it('informa quando a chave não está configurada', async () => {
    expect(await health({}).json()).toEqual({ ok: true, openaiKey: false });
  });

  it('recusa métodos diferentes de GET', async () => {
    const response = await handler.fetch(
      new Request('https://ecoscan-v1.vercel.app/api/health', { method: 'POST' }),
    );
    expect(response.status).toBe(405);
  });
});
