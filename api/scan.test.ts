// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { ScanResult } from '../src/shared/contracts/index.js';
import type { ScanModel } from './_lib/openai.js';
import { createScanHandler, MAX_IMAGE_BYTES } from './scan.js';

const ORIGIN = 'https://ecoscan-v1.vercel.app';
const env = { ALLOWED_ORIGIN: ORIGIN };
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6]).toString('base64');

const battery: ScanResult = {
  identified: true,
  itemName: 'Pilha alcalina AA',
  material: 'Zinco, manganês, aço',
  category: 'pilhas_baterias',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Leve a um ponto de coleta de pilhas.',
  categoryReason: 'Pilhas têm metais pesados.',
  consequence: 'Contamina o solo e a água.',
  spokenSummary: 'Isso é uma pilha. Leve a um ponto de coleta.',
};

function request(body: unknown, { origin = ORIGIN, method = 'POST' } = {}) {
  return new Request('https://x/api/scan', {
    method,
    headers: { origin, 'content-type': 'application/json' },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

function setup(model: ScanModel, timeoutMs = 20_000) {
  const log = vi.fn();
  const spy = vi.fn(model);
  const handle = createScanHandler({ model: () => spy, env, log, timeoutMs });
  return { handle, model: spy, log };
}

const answers = (...outputs: string[]): ScanModel => {
  let i = 0;
  return async () => outputs[Math.min(i++, outputs.length - 1)]!;
};

describe('POST /api/scan', () => {
  it('foto válida → 200 com o ScanResult', async () => {
    const { handle, model } = setup(answers(JSON.stringify(battery)));

    const response = await handle(request({ imageBase64: JPEG }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(battery);
    expect(model).toHaveBeenCalledOnce();
    expect(model.mock.calls[0]?.[0]).toBe(JPEG);
  });

  it('aplica as regras de confiança no servidor', async () => {
    const { handle } = setup(answers(JSON.stringify({ ...battery, confidence: 'baixa' })));

    const response = await handle(request({ imageBase64: JPEG }));

    expect(((await response.json()) as ScanResult).category).toBe('desconhecido');
  });

  it('método diferente de POST → 405', async () => {
    const { handle } = setup(answers('{}'));

    expect((await handle(request(null, { method: 'GET' }))).status).toBe(405);
  });

  it('origem não permitida → 403, sem chamar a IA', async () => {
    const { handle, model } = setup(answers('{}'));

    const response = await handle(
      request({ imageBase64: JPEG }, { origin: 'https://evil.example' }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'forbidden_origin' });
    expect(model).not.toHaveBeenCalled();
  });

  it.each([
    ['corpo que não é JSON', 'isso não é json'],
    ['sem imageBase64', { foto: JPEG }],
    ['base64 inválido', { imageBase64: 'não é base64!' }],
    ['prefixo data: incluído', { imageBase64: `data:image/jpeg;base64,${JPEG}` }],
    [
      'PNG em vez de JPEG',
      { imageBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]).toString('base64') },
    ],
  ])('%s → 400 invalid_image', async (_, body) => {
    const { handle, model } = setup(answers('{}'));

    const response = await handle(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_image' });
    expect(model).not.toHaveBeenCalled();
  });

  it('imagem acima de 1 MB → 413', async () => {
    const { handle, model } = setup(answers('{}'));
    const big = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(MAX_IMAGE_BYTES),
    ]).toString('base64');

    const response = await handle(request({ imageBase64: big }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'image_too_large' });
    expect(model).not.toHaveBeenCalled();
  });

  it.each([
    ['JSON quebrado', '{"identified": tr'],
    ['fora do schema', JSON.stringify({ ...battery, category: 'lixo' })],
    ['texto longo demais', JSON.stringify({ ...battery, disposal: 'a'.repeat(241) })],
  ])('resposta da IA %s → 1 retry e sucesso', async (_, bad) => {
    const { handle, model } = setup(answers(bad, JSON.stringify(battery)));

    const response = await handle(request({ imageBase64: JPEG }));

    expect(response.status).toBe(200);
    expect(model).toHaveBeenCalledTimes(2);
  });

  it('resposta inválida duas vezes → 502, sem terceira tentativa', async () => {
    const { handle, model } = setup(answers('{}', '{}', JSON.stringify(battery)));

    const response = await handle(request({ imageBase64: JPEG }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'ai_unavailable' });
    expect(model).toHaveBeenCalledTimes(2);
  });

  it('erro da API da OpenAI → 502 sem retry', async () => {
    const { handle, model } = setup(async () => {
      throw new Error('500 Internal Server Error');
    });

    const response = await handle(request({ imageBase64: JPEG }));

    expect(response.status).toBe(502);
    expect(model).toHaveBeenCalledOnce();
  });

  it('IA demora além do limite → 504 e cancela a chamada', async () => {
    let aborted = false;
    const { handle } = setup(
      (_, signal) =>
        new Promise<string>(() => {
          signal.addEventListener('abort', () => (aborted = true));
        }),
      50,
    );

    const response = await handle(request({ imageBase64: JPEG }));

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: 'ai_timeout' });
    expect(aborted).toBe(true);
  });

  it('o log registra por que cada tentativa foi rejeitada, sem o conteúdo', async () => {
    const tooLong = 'x'.repeat(241);
    const { handle, log } = setup(
      answers('{"quebrado', JSON.stringify({ ...battery, disposal: tooLong })),
    );

    await handle(request({ imageBase64: JPEG }));

    const entry = log.mock.calls[0]?.[0] as { status: number; rejections: string[] };
    expect(entry.status).toBe(502);
    expect(entry.rejections).toEqual(['json', 'schema:disposal:too_big']);
    expect(JSON.stringify(entry)).not.toContain(tooLong);
  });

  it('o log não contém a imagem nem o texto da IA', async () => {
    const { handle, log } = setup(answers(JSON.stringify(battery)));

    await handle(request({ imageBase64: JPEG }));

    expect(log).toHaveBeenCalledOnce();
    const entry = JSON.stringify(log.mock.calls[0]?.[0]);
    expect(entry).not.toContain(JPEG);
    expect(entry).not.toContain(battery.itemName);
    expect(log.mock.calls[0]?.[0]).toMatchObject({
      event: 'scan',
      status: 200,
      category: 'pilhas_baterias',
      attempts: 1,
      promptVersion: expect.any(String),
    });
  });
});
