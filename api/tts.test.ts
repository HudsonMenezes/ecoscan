// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { TtsModel } from './_lib/tts.js';
import { createTtsHandler, MAX_TEXT_CHARS } from './tts.js';

const ORIGIN = 'https://ecoscan-v1.vercel.app';
const env = { ALLOWED_ORIGIN: ORIGIN };
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]); // "ID3..."

function request(body: unknown, { origin = ORIGIN, method = 'POST' } = {}) {
  return new Request('https://x/api/tts', {
    method,
    headers: { origin, 'content-type': 'application/json' },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

const streamOf = (bytes: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

function setup(model: TtsModel = async () => streamOf(MP3), timeoutMs = 10_000) {
  const log = vi.fn();
  const spy = vi.fn(model);
  const handle = createTtsHandler({ model: () => spy, env, log, timeoutMs });
  return { handle, model: spy, log };
}

describe('POST /api/tts', () => {
  it('texto válido → 200 audio/mpeg com o áudio da OpenAI', async () => {
    const { handle, model } = setup();

    const response = await handle(request({ text: '  Isso é uma pilha.  ' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(MP3);
    expect(model.mock.calls[0]?.[0]).toBe('Isso é uma pilha.');
  });

  it(`aceita exatamente ${MAX_TEXT_CHARS} caracteres, com acentos`, async () => {
    const { handle } = setup();
    const response = await handle(request({ text: 'é'.repeat(MAX_TEXT_CHARS) }));
    expect(response.status).toBe(200);
  });

  it.each([
    ['texto vazio', { text: '' }],
    ['só espaços', { text: '   ' }],
    [`mais de ${MAX_TEXT_CHARS} caracteres`, { text: 'a'.repeat(MAX_TEXT_CHARS + 1) }],
    ['sem o campo text', { foo: 'bar' }],
    ['text que não é string', { text: 42 }],
    ['escrita não latina', { text: 'Olá مواد' }],
    ['JSON quebrado', '{"text":'],
  ])('%s → 400 invalid_text, sem chamar a OpenAI', async (_, body) => {
    const { handle, model } = setup();

    const response = await handle(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_text' });
    expect(model).not.toHaveBeenCalled();
  });

  it('corpo gigante → 400 sem ler tudo', async () => {
    const { handle, model } = setup();
    const response = await handle(request({ text: 'a'.repeat(10_000) }));
    expect(response.status).toBe(400);
    expect(model).not.toHaveBeenCalled();
  });

  it('origem não permitida → 403', async () => {
    const { handle, model } = setup();
    const response = await handle(request({ text: 'Olá' }, { origin: 'https://outro.site' }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'forbidden_origin' });
    expect(model).not.toHaveBeenCalled();
  });

  it('GET → 405', async () => {
    const { handle } = setup();
    expect((await handle(request(null, { method: 'GET' }))).status).toBe(405);
  });

  it('erro da OpenAI → 502 tts_unavailable', async () => {
    const { handle } = setup(async () => {
      throw new Error('falhou');
    });
    const response = await handle(request({ text: 'Olá' }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'tts_unavailable' });
  });

  it('OpenAI lenta → 502 e cancela a chamada', async () => {
    let aborted = false;
    const { handle } = setup(
      (_, signal) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new Error('abortado'));
          });
        }),
      20,
    );

    const response = await handle(request({ text: 'Olá' }));

    expect(response.status).toBe(502);
    expect(aborted).toBe(true);
  });

  it('o log não leva o texto', async () => {
    const { handle, log } = setup();
    await handle(request({ text: 'Segredo do usuário' }));

    const entry = log.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entry).toMatchObject({ event: 'tts', status: 200, chars: 18 });
    expect(JSON.stringify(entry)).not.toContain('Segredo');
  });
});
