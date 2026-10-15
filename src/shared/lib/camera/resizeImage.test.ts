import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeTargetSize, MAX_BYTES, resizeImageFile, resizeToJpeg } from './resizeImage';

describe('computeTargetSize', () => {
  it.each([
    [4000, 3000, 1024, 768],
    [3000, 4000, 768, 1024],
    [2048, 2048, 1024, 1024],
    [1920, 1080, 1024, 576],
    [800, 600, 800, 600],
    [1024, 500, 1024, 500],
    [5000, 3, 1024, 1],
  ])('%ix%i → %ix%i', (width, height, expectedWidth, expectedHeight) => {
    expect(computeTargetSize(width, height)).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    });
  });
});

// O jsdom não tem canvas: simulamos o contexto 2D e o toBlob.
function mockCanvas(sizesByQuality: Record<number, number | null>) {
  const drawImage = vi.fn();
  const toBlob = vi.fn(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    const size = sizesByQuality[quality ?? 0];
    callback(size === null || size === undefined ? null : new Blob(['x'.repeat(size)], { type }));
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlob);
  return { drawImage, toBlob };
}

describe('resizeToJpeg', () => {
  afterEach(() => vi.restoreAllMocks());

  it('desenha sem espelhar no tamanho reduzido e gera JPEG', async () => {
    const { drawImage, toBlob } = mockCanvas({ 0.85: 1000 });
    const source = {} as CanvasImageSource;

    const blob = await resizeToJpeg(source, 4000, 3000);

    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 1024, 768);
    expect(toBlob).toHaveBeenCalledOnce();
    expect(toBlob.mock.calls[0]?.[1]).toBe('image/jpeg');
    expect(blob.type).toBe('image/jpeg');
  });

  it('baixa a qualidade até caber no limite de bytes', async () => {
    const { toBlob } = mockCanvas({ 0.85: MAX_BYTES + 1, 0.7: MAX_BYTES + 1, 0.55: 500 });

    const blob = await resizeToJpeg({} as CanvasImageSource, 1024, 1024);

    expect(toBlob.mock.calls.map((call) => call[2])).toEqual([0.85, 0.7, 0.55]);
    expect(blob.size).toBe(500);
  });

  it('falha com erro claro se o navegador não gerar o JPEG', async () => {
    mockCanvas({ 0.85: null });

    await expect(resizeToJpeg({} as CanvasImageSource, 10, 10)).rejects.toThrow(
      'Falha ao gerar o JPEG',
    );
  });
});

describe('resizeImageFile', () => {
  const close = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 3000, height: 4000, close })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    close.mockClear();
  });

  it('respeita a orientação do EXIF, redimensiona e libera o bitmap', async () => {
    const { drawImage } = mockCanvas({ 0.85: 100 });
    const file = new Blob(['jpeg'], { type: 'image/jpeg' });

    const blob = await resizeImageFile(file);

    expect(createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 768, 1024);
    expect(blob.type).toBe('image/jpeg');
    expect(close).toHaveBeenCalledOnce();
  });

  it('libera o bitmap mesmo quando a recodificação falha', async () => {
    mockCanvas({ 0.85: null });

    await expect(resizeImageFile(new Blob(['x']))).rejects.toThrow();
    expect(close).toHaveBeenCalledOnce();
  });
});
