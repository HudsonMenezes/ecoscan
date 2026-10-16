import { expect, test, type Page } from '@playwright/test';
import QRCode from 'qrcode';

// Leitor de QR do app com uma "câmera" que mostra um QR de verdade: o getUserMedia
// devolve o stream de um canvas com o QR desenhado módulo a módulo (uma imagem
// `data:` seria bloqueada pela CSP). Sem BarcodeDetector, para exercitar o jsQR
// (o caminho do iPhone).
async function cameraShowingQr(page: Page, text: string) {
  const { modules } = QRCode.create(text);
  const qr = { size: modules.size, dark: Array.from(modules.data, Boolean) };
  await page.addInitScript(({ size, dark }) => {
    delete (window as { BarcodeDetector?: unknown }).BarcodeDetector;
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      const quiet = 4; // margem branca, em módulos
      const cell = Math.floor(420 / (size + 2 * quiet));
      const side = cell * (size + 2 * quiet);
      const left = (640 - side) / 2;
      const top = (480 - side) / 2;
      const draw = () => {
        context.fillStyle = '#777';
        context.fillRect(0, 0, 640, 480);
        context.fillStyle = '#fff';
        context.fillRect(left, top, side, side);
        context.fillStyle = '#000';
        dark.forEach((on, i) => {
          if (!on) return;
          const x = left + (quiet + (i % size)) * cell;
          const y = top + (quiet + Math.floor(i / size)) * cell;
          context.fillRect(x, y, cell, cell);
        });
        requestAnimationFrame(draw);
      };
      draw();
      return canvas.captureStream(15);
    };
  }, qr);
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

test('a câmera liga sozinha, lê o QR do ponto e credita o descarte', async ({ page }) => {
  await cameraShowingQr(page, 'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo');
  await seedRecentScan(page);

  await page.goto('/descartar');

  await expect(page.getByRole('heading', { name: 'Parabéns!' })).toBeVisible();
  await expect(page).toHaveURL(/\/descartar\?ponto=escola-demo$/);
  await expect(page.getByText('+10 XP e +5 moedas')).toBeVisible();
});

test('QR de outro site → "não é um ponto do EcoScan" e "Ler outro QR"', async ({ page }) => {
  await cameraShowingQr(page, 'https://exemplo.com/promocao');

  await page.goto('/descartar');

  await expect(page.getByRole('alert')).toContainText('Esse QR não é um ponto do EcoScan.');
  await expect(page.getByRole('button', { name: 'Ler outro QR' })).toBeVisible();
  await expect(page).toHaveURL(/\/descartar$/);
});
