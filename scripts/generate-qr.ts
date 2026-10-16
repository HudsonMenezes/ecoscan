// Gera o QR do ponto de coleta de demonstração:
//   public/imprimir/qr-escola-demo.svg  (usado pela folha A4 publicada em /imprimir/ponto-de-descarte.html)
//   print/qr-escola-demo.svg            (vetor, para gráfica)
//   print/qr-escola-demo.png            (1024px, para quem só quer a imagem)
// O conteúdo do QR é uma URL, para funcionar no leitor do app e na câmera nativa.
// A folha em si (HTML + CSS) é estática, em public/imprimir/.
// Uso: npm run qr:demo   (QR_BASE_URL=https://outro-dominio npm run qr:demo)
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const BASE_URL = (process.env.QR_BASE_URL ?? 'https://ecoscan-v1.vercel.app').replace(/\/$/, '');
const POINT_ID = 'escola-demo';
const POINT_URL = `${BASE_URL}/descartar?ponto=${POINT_ID}`;

const QR_OPTIONS = {
  errorCorrectionLevel: 'H', // aguenta papel amassado ou um pouco sujo
  margin: 4,
  color: { dark: '#1a1a1a', light: '#ffffff' },
} as const;

const printDir = new URL('../print/', import.meta.url);
const sheetDir = new URL('../public/imprimir/', import.meta.url);
await mkdir(printDir, { recursive: true });
await mkdir(sheetDir, { recursive: true });

const svg = (await QRCode.toString(POINT_URL, { ...QR_OPTIONS, type: 'svg' })) + '\n';
await writeFile(new URL(`qr-${POINT_ID}.svg`, printDir), svg);
await writeFile(new URL(`qr-${POINT_ID}.svg`, sheetDir), svg);
await QRCode.toFile(fileURLToPath(new URL(`qr-${POINT_ID}.png`, printDir)), POINT_URL, {
  ...QR_OPTIONS,
  type: 'png',
  width: 1024,
});

console.log(`print/qr-${POINT_ID}.{svg,png} e public/imprimir/qr-${POINT_ID}.svg → ${POINT_URL}`);
