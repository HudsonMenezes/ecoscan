import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';

// Folha A4 do ponto de descarte: página estática em public/imprimir/, aberta por um link
// (docs/DEMO.md). Precisa abrir sem violar a CSP, mostrar o QR certo e caber em 1 página.
const SHEET = '/imprimir/ponto-de-descarte.html';
const MM_10 = (10 * 96) / 25.4; // 10mm em px CSS
const POINT_URL = 'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo';

test('a folha do ponto de descarte abre, tem o QR do ponto e imprime em 1 página A4', async ({
  page,
  request,
}) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') violations.push(message.text());
  });

  await page.goto(SHEET);

  await expect(page.getByRole('heading', { level: 1, name: 'Ponto de Descarte' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  const qr = page.getByRole('img', { name: 'QR do ponto de descarte do EcoScan' });
  await expect(qr).toBeVisible();
  expect(await qr.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // O SVG publicado é o QR da URL do ponto (gerado por `npm run qr:demo`).
  const svg = await (await request.get('/imprimir/qr-escola-demo.svg')).text();
  const expected = await QRCode.toString(POINT_URL, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 4,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
  expect(svg.trim()).toBe(expected.trim());

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.toolbar')).toBeHidden();
  // A folha corta o que passar de 297mm: o rodapé precisa caber inteiro, antes da margem de 10mm.
  const sheet = await page.locator('.sheet').boundingBox();
  const footer = await page.locator('.footer').boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(sheet!.y + sheet!.height - MM_10 + 1); // 1px: arredondamento
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
  expect(pages).toHaveLength(1);

  expect(violations).toEqual([]);
});
