// Gera o PDF da folha A4 do ponto de descarte (uma página), a partir da página publicada:
//   print/ponto-de-descarte.pdf
//   public/imprimir/ponto-de-descarte.pdf  (para baixar pelo site)
// Usa o Chromium do Playwright (npx playwright install chromium). Falha se não couber em 1 página.
// Uso: npm run sheet:pdf   (SHEET_URL=http://localhost:4173/imprimir/ponto-de-descarte.html npm run sheet:pdf)
import { copyFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const SHEET_URL =
  process.env.SHEET_URL ?? 'https://ecoscan-v1.vercel.app/imprimir/ponto-de-descarte.html';

const browser = await chromium.launch();
try {
  // Navegador limpo e sem service worker: sempre a versão publicada da folha.
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(SHEET_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });

  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
  if (pages !== 1) throw new Error(`O PDF saiu com ${pages} páginas; a folha precisa caber em 1.`);

  const printPath = new URL('../print/ponto-de-descarte.pdf', import.meta.url);
  await writeFile(printPath, pdf);
  await copyFile(printPath, new URL('../public/imprimir/ponto-de-descarte.pdf', import.meta.url));
  console.log(`print/ponto-de-descarte.pdf e public/imprimir/ponto-de-descarte.pdf ← ${SHEET_URL}`);
} finally {
  await browser.close();
}
