// Gera o favicon (SVG) e os ícones PNG do PWA a partir de um único desenho.
// Rasteriza com o Chromium do Playwright, que já é dependência de dev.
// Uso: npm run icons
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const GREEN = '#1b7f3b';

// Folha dentro de cantos de "mira" de câmera, num quadro de 512x512.
const GLYPH = `
  <g fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <path d="M112 176v-48a16 16 0 0 1 16-16h48M336 112h48a16 16 0 0 1 16 16v48M400 336v48a16 16 0 0 1-16 16h-48M176 400h-48a16 16 0 0 1-16-16v-48"/>
  </g>
  <path fill="#fff" d="M340 168c-110 0-172 48-172 128 0 22 6 40 16 54 18-52 58-90 118-112-48 30-80 70-96 124 12 6 28 10 46 10 80 0 108-80 88-204z"/>
`;

// `inset` encolhe o desenho para caber na zona segura do ícone maskable (80%).
function iconSvg({ rounded, inset = 1 }: { rounded: boolean; inset?: number }) {
  const offset = (512 * (1 - inset)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="${GREEN}"/>
  <g transform="translate(${offset} ${offset}) scale(${inset})">${GLYPH}</g>
</svg>`;
}

const outputs = [
  { file: 'pwa-192x192.png', size: 192, svg: iconSvg({ rounded: true }) },
  { file: 'pwa-512x512.png', size: 512, svg: iconSvg({ rounded: true }) },
  { file: 'maskable-icon-512x512.png', size: 512, svg: iconSvg({ rounded: false, inset: 0.75 }) },
  { file: 'apple-touch-icon-180x180.png', size: 180, svg: iconSvg({ rounded: false }) },
];

const publicDir = new URL('../public/', import.meta.url);

await writeFile(new URL('favicon.svg', publicDir), iconSvg({ rounded: true }) + '\n');

const browser = await chromium.launch();
try {
  for (const { file, size, svg } of outputs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: fileURLToPath(new URL(file, publicDir)), omitBackground: true });
    await page.close();
    console.log(`public/${file}`);
  }
} finally {
  await browser.close();
}
