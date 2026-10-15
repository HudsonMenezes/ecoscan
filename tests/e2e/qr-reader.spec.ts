import { expect, test, type Page } from '@playwright/test';
import QRCode from 'qrcode';

// Leitor de QR do app com uma "câmera" que mostra um QR de verdade: o getUserMedia
// devolve o stream de um canvas com a imagem do QR. Sem BarcodeDetector, para
// exercitar o jsQR (o caminho do iPhone).
async function cameraShowingQr(page: Page, text: string) {
  const qrDataUrl = await QRCode.toDataURL(text, { margin: 4, width: 480 });
  await page.addInitScript((src) => {
    delete (window as { BarcodeDetector?: unknown }).BarcodeDetector;
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      const image = new Image();
      image.src = src;
      await image.decode();
      const draw = () => {
        context.fillStyle = '#777';
        context.fillRect(0, 0, 640, 480);
        context.drawImage(image, 120, 30, 420, 420);
        requestAnimationFrame(draw);
      };
      draw();
      return canvas.captureStream(15);
    };
  }, qrDataUrl);
}

async function seedRecentScan(page: Page) {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'ecoscan:last-scan',
      JSON.stringify({
        id: crypto.randomUUID(),
        category: 'vidro',
        itemName: 'Pote de vidro',
        scannedAt: new Date().toISOString(),
      }),
    ),
  );
}

test('lê o QR do ponto pelo app e credita o descarte', async ({ page }) => {
  await cameraShowingQr(page, 'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo');
  await seedRecentScan(page);

  await page.goto('/descartar');
  await page.getByRole('button', { name: 'Ler QR do ponto' }).click();

  await expect(page.getByRole('heading', { name: 'Parabéns!' })).toBeVisible();
  await expect(page).toHaveURL(/\/descartar\?ponto=escola-demo$/);
  await expect(page.getByText('+10 XP e +5 moedas')).toBeVisible();
});

test('QR de outro site → "não é um ponto do EcoScan" e "Ler outro QR"', async ({ page }) => {
  await cameraShowingQr(page, 'https://exemplo.com/promocao');

  await page.goto('/descartar');
  await page.getByRole('button', { name: 'Ler QR do ponto' }).click();

  await expect(page.getByRole('alert')).toContainText('Esse QR não é um ponto do EcoScan.');
  await expect(page.getByRole('button', { name: 'Ler outro QR' })).toBeVisible();
  await expect(page).toHaveURL(/\/descartar$/);
});
