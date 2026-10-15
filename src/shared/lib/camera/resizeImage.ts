// Redimensiona e recodifica imagens em JPEG via canvas. Recodificar descarta
// todos os metadados (EXIF, GPS), então toda foto que sai do app passa por aqui.

export const MAX_SIDE = 1024;
// A /api/scan aceita até 1 MB decodificado; sobra margem para o base64.
export const MAX_BYTES = 900_000;
const QUALITIES = [0.85, 0.7, 0.55, 0.4];

export function computeTargetSize(width: number, height: number, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function toJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar o JPEG'))),
      'image/jpeg',
      quality,
    );
  });
}

// Desenha `source` (vídeo, bitmap ou imagem) sem espelhar e devolve um JPEG
// com no máximo MAX_SIDE px no lado maior, baixando a qualidade se passar de MAX_BYTES.
export async function resizeToJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Blob> {
  const { width, height } = computeTargetSize(sourceWidth, sourceHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponível');
  context.drawImage(source, 0, 0, width, height);

  let blob: Blob | undefined;
  for (const quality of QUALITIES) {
    blob = await toJpeg(canvas, quality);
    if (blob.size <= MAX_BYTES) break;
  }
  return blob!;
}

// Arquivo enviado pelo usuário → JPEG redimensionado. Aplica a orientação do
// EXIF antes de descartá-lo, para fotos de celular não ficarem deitadas.
export async function resizeImageFile(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    return await resizeToJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
