// Gera public/qr-site.svg: QR estático que abre o EcoScan no celular.
// Fica commitado, para não haver biblioteca de QR no bundle.
// Uso: npm run qr:site
import { writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';

const SITE_URL = 'https://ecoscan-v1.vercel.app';

const svg = await QRCode.toString(SITE_URL, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#1a1a1a', light: '#ffffff' },
});

await writeFile(new URL('../public/qr-site.svg', import.meta.url), svg + '\n');
console.log(`public/qr-site.svg → ${SITE_URL}`);
