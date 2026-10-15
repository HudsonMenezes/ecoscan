import type { Page } from '@playwright/test';

export const BATTERY_RESULT = {
  identified: true,
  itemName: 'Pilha alcalina AA',
  material: 'Zinco, manganês e aço',
  category: 'pilhas_baterias',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Não jogue no lixo comum. Leve a um ponto de coleta de pilhas.',
  categoryReason: 'Pilhas têm metais pesados e precisam de coleta especial.',
  consequence: 'Libera metais pesados que contaminam o solo e a água.',
  spokenSummary: 'É uma pilha. Leve a um ponto de coleta de pilhas.',
};

// Intercepta /api/scan (sem chamar a IA) e guarda as fotos que o app enviou.
export async function interceptScan(page: Page, result: object = BATTERY_RESULT) {
  const photos: Buffer[] = [];
  await page.route('**/api/scan', async (route) => {
    const { imageBase64 } = route.request().postDataJSON() as { imageBase64: string };
    photos.push(Buffer.from(imageBase64, 'base64'));
    await route.fulfill({ json: result });
  });
  return photos;
}

// Largura e altura lidas do cabeçalho SOF do JPEG.
export function jpegSize(jpeg: Buffer) {
  let offset = 2;
  while (offset < jpeg.length) {
    const marker = jpeg.readUInt16BE(offset);
    const length = jpeg.readUInt16BE(offset + 2);
    if (marker >= 0xffc0 && marker <= 0xffc3) {
      return { height: jpeg.readUInt16BE(offset + 5), width: jpeg.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('JPEG sem cabeçalho SOF');
}

export function hasExif(jpeg: Buffer) {
  return jpeg.includes(Buffer.from('Exif\0\0', 'binary'));
}
