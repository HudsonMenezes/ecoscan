// Gera o QR do ponto de coleta de demonstração, para imprimir:
//   print/qr-escola-demo.svg   (vetor, para gráfica)
//   print/qr-escola-demo.png   (1024px, para quem só quer imprimir)
//   print/qr-escola-demo.html  (folha A4 com o QR, o logo e as categorias)
// O conteúdo do QR é uma URL, para funcionar no leitor do app e na câmera nativa.
// Uso: npm run qr:demo   (QR_BASE_URL=https://outro-dominio npm run qr:demo)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const BASE_URL = (process.env.QR_BASE_URL ?? 'https://ecoscan-v1.vercel.app').replace(/\/$/, '');
const POINT_ID = 'escola-demo';
const POINT_URL = `${BASE_URL}/descartar?ponto=${POINT_ID}`;

// Cores CONAMA, as mesmas de src/modules/scanner/model/categories.ts. Ficam aqui porque
// os scripts rodam direto no Node, sem o alias `@/` do app.
const CATEGORIES = [
  { label: 'Papel', color: '#1f5fae', text: '#fff' },
  { label: 'Plástico', color: '#c62828', text: '#fff' },
  { label: 'Metal', color: '#f2b01e', text: '#1a1a1a' },
  { label: 'Vidro', color: '#1b7f3b', text: '#fff' },
  { label: 'Orgânico', color: '#6d4c41', text: '#fff' },
  { label: 'Pilhas, eletrônicos, lâmpadas, remédios e óleo', color: '#ef6c00', text: '#1a1a1a' },
];

const QR_OPTIONS = {
  errorCorrectionLevel: 'H', // aguenta papel amassado ou um pouco sujo
  margin: 4,
  color: { dark: '#1a1a1a', light: '#ffffff' },
} as const;

const printDir = new URL('../print/', import.meta.url);
await mkdir(printDir, { recursive: true });

const svg = await QRCode.toString(POINT_URL, { ...QR_OPTIONS, type: 'svg' });
await writeFile(new URL(`qr-${POINT_ID}.svg`, printDir), svg + '\n');
await QRCode.toFile(fileURLToPath(new URL(`qr-${POINT_ID}.png`, printDir)), POINT_URL, {
  ...QR_OPTIONS,
  type: 'png',
  width: 1024,
});

const logo = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const chips = CATEGORIES.map(
  (c) => `<li style="background:${c.color};color:${c.text}">${c.label}</li>`,
).join('\n        ');

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Ponto de coleta EcoScan</title>
    <style>
      @page { size: A4; margin: 15mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        color: #1a1a1a;
        text-align: center;
      }
      .sheet { display: flex; flex-direction: column; align-items: center; gap: 8mm; }
      header { display: flex; align-items: center; gap: 5mm; }
      header svg { width: 22mm; height: 22mm; }
      h1 { margin: 0; font-size: 34pt; color: #1b7f3b; }
      .qr svg { width: 125mm; height: 125mm; }
      .steps { margin: 0; font-size: 18pt; line-height: 1.4; }
      ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 3mm; margin: 0; padding: 0; list-style: none; }
      li { padding: 2mm 5mm; border-radius: 999px; font-size: 13pt; font-weight: 700; }
      .url { font-size: 10pt; color: #4a4a4a; }
      @media print { li { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header>
        ${logo.trim()}
        <h1>Ponto de coleta EcoScan</h1>
      </header>
      <p class="steps">
        1. Escaneie o item no app EcoScan.<br />
        2. Descarte no lugar certo.<br />
        3. Leia este QR e ganhe XP e moedas!
      </p>
      <div class="qr">${svg.trim()}</div>
      <ul aria-label="Categorias aceitas">
        ${chips}
      </ul>
      <p class="url">${POINT_URL}</p>
    </main>
  </body>
</html>
`;
await writeFile(new URL(`qr-${POINT_ID}.html`, printDir), html);

console.log(`print/qr-${POINT_ID}.{svg,png,html} → ${POINT_URL}`);
