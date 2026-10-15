import { describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import type { ScanResult } from '@/shared/contracts';
import { blobToBase64, scanImage, ScanError } from './scanImage';

const result: ScanResult = {
  identified: true,
  itemName: 'Garrafa PET',
  material: 'Plástico PET',
  category: 'plastico',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Coleta seletiva, no recipiente vermelho.',
  categoryReason: 'É feita de plástico.',
  consequence: 'Demora centenas de anos para se decompor.',
  benefit: 'Reciclando, o material vira um produto novo e o ambiente fica mais limpo.',
  spokenSummary: 'É uma garrafa PET. Coloque na coleta seletiva.',
};

const photo = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });

function respond(status: number, body: unknown) {
  return vi.fn(async () => Response.json(body, { status }));
}

describe('blobToBase64', () => {
  it('converte os bytes da foto em base64, sem prefixo data:', async () => {
    expect(await blobToBase64(photo)).toBe('/9j/4A==');
  });

  it('aguenta fotos grandes (sem estourar a pilha)', async () => {
    const big = new Blob([new Uint8Array(900_000).fill(65)]);
    expect((await blobToBase64(big)).length).toBe(1_200_000);
  });
});

describe('scanImage', () => {
  it('envia a foto em base64 e devolve o resultado validado', async () => {
    const fetchImpl = respond(200, result);

    await expect(scanImage(photo, { fetchImpl })).resolves.toEqual(result);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/scan');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ imageBase64: '/9j/4A==' });
  });

  it.each([
    [429, 'rate_limited', strings.scanErrors.rateLimited],
    [413, 'too_large', strings.scanErrors.tooLarge],
    [400, 'invalid_image', strings.scanErrors.invalidImage],
    [504, 'timeout', strings.scanErrors.timeout],
    [502, 'unavailable', strings.scanErrors.unavailable],
    [500, 'unavailable', strings.scanErrors.unavailable],
    [403, 'unavailable', strings.scanErrors.unavailable],
  ])('HTTP %i → %s com mensagem amigável', async (status, kind, message) => {
    const error = await scanImage(photo, { fetchImpl: respond(status, { error: 'x' }) }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ScanError);
    expect(error).toMatchObject({ kind, message });
  });

  it('sem internet → network', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(scanImage(photo, { fetchImpl })).rejects.toMatchObject({ kind: 'network' });
  });

  it('resposta fora do contrato → unavailable (texto da IA nunca passa sem validar)', async () => {
    const fetchImpl = respond(200, { ...result, category: 'lixo' });

    await expect(scanImage(photo, { fetchImpl })).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('cancelado por quem chamou → repassa o abort, sem virar mensagem de erro', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
    );

    const pending = scanImage(photo, { fetchImpl, signal: controller.signal });
    controller.abort();

    const error = await pending.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ScanError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });
});
