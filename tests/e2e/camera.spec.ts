import { expect, test, type Page } from '@playwright/test';

// Segmento APP1 com EXIF mínimo: só a tag Orientation = 6 (girar 90° no sentido horário).
function exifOrientation6() {
  const tiff = Buffer.from(
    [
      '49492a00', // 'II' (little-endian) + 42
      '08000000', // offset do primeiro IFD
      '0100', // 1 entrada
      '1201' + '0300' + '01000000' + '06000000', // tag 0x0112 (Orientation), SHORT, 1 valor, 6
      '00000000', // sem próximo IFD
    ].join(''),
    'hex',
  );
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const header = Buffer.alloc(4);
  header.writeUInt16BE(0xffe1, 0);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
}

// Gera no navegador um JPEG grande e injeta o EXIF logo depois do SOI.
async function bigJpegWithExif(page: Page, width: number, height: number) {
  const bytes = await page.evaluate(
    async ([w, h]) => {
      const canvas = document.createElement('canvas');
      canvas.width = w!;
      canvas.height = h!;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#3a7';
      context.fillRect(0, 0, w!, h!);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9),
      );
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    [width, height],
  );
  const jpeg = Buffer.from(bytes);
  return Buffer.concat([jpeg.subarray(0, 2), exifOrientation6(), jpeg.subarray(2)]);
}

async function previewBytes(page: Page) {
  return page.getByRole('img').evaluate(async (img: HTMLImageElement) => {
    const buffer = await (await fetch(img.src)).arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  });
}

test.describe('câmera', () => {
  test.use({ permissions: ['camera'] });

  test('abre a câmera só no toque, captura e gera um JPEG', async ({ page }) => {
    await page.goto('/escanear');
    await expect(page.locator('video')).toHaveCount(0);

    await page.getByRole('button', { name: 'Abrir câmera' }).click();
    await expect(page.locator('video')).toBeVisible();
    await page.waitForFunction(() => document.querySelector('video')!.videoWidth > 0);
    await page.getByRole('button', { name: 'Tirar foto' }).click();

    // A câmera falsa entrega 640x480 ou 1920x1080 (pedimos 1080p como ideal).
    const info = page.getByTestId('photo-info');
    await expect(info).toContainText(/\d+×\d+ · .* · image\/jpeg/);
    const [, width, height] = /(\d+)×(\d+)/.exec((await info.textContent()) ?? '')!;
    expect(Math.max(Number(width), Number(height))).toBeLessThanOrEqual(1024);
  });

  test('upload: aplica a orientação, reduz para ≤ 1024px e remove o EXIF', async ({ page }) => {
    await page.goto('/escanear');
    const original = await bigJpegWithExif(page, 3000, 2000);
    expect(original.includes(Buffer.from('Exif\0\0', 'binary'))).toBe(true);

    await page.getByLabel('Enviar foto').setInputFiles({
      name: 'foto.jpg',
      mimeType: 'image/jpeg',
      buffer: original,
    });

    // 3000x2000 deitado + Orientation 6 → em pé, reduzido para 683x1024.
    await expect(page.getByTestId('photo-info')).toContainText('683×1024');
    const result = Buffer.from(await previewBytes(page));
    expect(result.includes(Buffer.from('Exif', 'binary'))).toBe(false);
    expect(result.length).toBeLessThanOrEqual(900_000);
  });
});

test('câmera negada mostra o aviso e o "Enviar foto"', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('negado', 'NotAllowedError'));
  });
  await page.goto('/escanear');

  await page.getByRole('button', { name: 'Abrir câmera' }).click();

  await expect(page.getByText('Sem permissão para usar a câmera')).toBeVisible();
  await expect(page.getByLabel('Enviar foto')).toHaveAttribute('accept', 'image/*');
});
