import QRCode from 'qrcode';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQrDecoder, decodePixels } from './decodeQr';

// Quadro RGBA de um QR de verdade (gerado pelo pacote `qrcode`), com margem branca,
// como a câmera veria um QR impresso.
function qrFrame(text: string, scale = 6, margin = 4) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const side = (modules.size + margin * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (!modules.get(row, col)) continue;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = (((row + margin) * scale + y) * side + (col + margin) * scale + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width: side, height: side };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodePixels (jsQR)', () => {
  it('lê a URL do QR de demonstração', async () => {
    const url = 'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo';
    expect(await decodePixels(qrFrame(url))).toBe(url);
  });

  it('quadro sem QR → null', async () => {
    const blank = { data: new Uint8ClampedArray(64 * 64 * 4).fill(255), width: 64, height: 64 };
    expect(await decodePixels(blank)).toBeNull();
  });
});

describe('createQrDecoder', () => {
  const canvas = () => document.createElement('canvas');

  it('usa o BarcodeDetector nativo quando ele lê QR', async () => {
    const detect = vi.fn().mockResolvedValue([{ rawValue: 'https://exemplo.com' }]);
    vi.stubGlobal(
      'BarcodeDetector',
      Object.assign(
        vi.fn(function () {
          return { detect };
        }),
        { getSupportedFormats: vi.fn().mockResolvedValue(['qr_code', 'ean_13']) },
      ),
    );

    const decode = await createQrDecoder();

    expect(await decode(canvas())).toBe('https://exemplo.com');
    expect(detect).toHaveBeenCalledOnce();
  });

  it('BarcodeDetector sem QR, ou que falha → cai no jsQR (sem quebrar)', async () => {
    for (const getSupportedFormats of [
      vi.fn().mockResolvedValue(['ean_13']),
      vi.fn().mockRejectedValue(new Error('sem suporte')),
    ]) {
      const Detector = Object.assign(vi.fn(), { getSupportedFormats });
      vi.stubGlobal('BarcodeDetector', Detector);

      const decode = await createQrDecoder();

      // O jsdom não desenha em canvas: o caminho do jsQR devolve null sem lançar.
      expect(await decode(canvas())).toBeNull();
      expect(Detector).not.toHaveBeenCalled();
    }
  });
});
