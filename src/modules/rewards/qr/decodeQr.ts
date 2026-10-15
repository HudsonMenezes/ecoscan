// Lê o texto de um QR num quadro da câmera. Usa o BarcodeDetector nativo quando o
// navegador tem (Android/Chrome), e o jsQR quando não tem (iPhone, Chrome no desktop).
// O jsQR só é baixado na primeira vez que precisa.

// O BarcodeDetector ainda não está nos tipos do DOM do TypeScript.
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorClass = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
};

export type FrameSource = HTMLVideoElement | HTMLCanvasElement;
export type QrDecoder = (frame: FrameSource) => Promise<string | null>;
type Pixels = { data: Uint8ClampedArray; width: number; height: number };

// Quadros grandes deixam o jsQR lento no celular; 640px no lado maior basta para um QR.
const MAX_SIDE = 640;

// Puro: pixels RGBA → texto do QR (ou null). É a parte testada com uma imagem de QR.
export async function decodePixels({ data, width, height }: Pixels): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

async function nativeDetector(): Promise<BarcodeDetectorLike | null> {
  const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const formats = await Detector.getSupportedFormats();
    return formats.includes('qr_code') ? new Detector({ formats: ['qr_code'] }) : null;
  } catch {
    return null;
  }
}

function frameSize(frame: FrameSource) {
  const width = frame instanceof HTMLVideoElement ? frame.videoWidth : frame.width;
  const height = frame instanceof HTMLVideoElement ? frame.videoHeight : frame.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function createQrDecoder(): Promise<QrDecoder> {
  const native = await nativeDetector();
  if (native) {
    return async (frame) => (await native.detect(frame))[0]?.rawValue ?? null;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return async (frame) => {
    const { width, height } = frameSize(frame);
    if (!context || !width || !height) return null;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(frame, 0, 0, width, height);
    return decodePixels(context.getImageData(0, 0, width, height));
  };
}
