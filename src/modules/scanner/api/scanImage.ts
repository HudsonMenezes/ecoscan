// Cliente de POST /api/scan: foto → ScanResult validado, ou ScanError com mensagem amigável.
import { strings } from '@/config/strings';
import { ScanResultSchema, type ScanResult } from '@/shared/contracts';

// O servidor tem 20 s de orçamento para a IA; a folga cobre upload e rede lenta.
export const CLIENT_TIMEOUT_MS = 30_000;

export type ScanErrorKind =
  'network' | 'rate_limited' | 'too_large' | 'invalid_image' | 'timeout' | 'unavailable';

export class ScanError extends Error {
  readonly kind: ScanErrorKind;

  constructor(kind: ScanErrorKind) {
    super(MESSAGES[kind]);
    this.name = 'ScanError';
    this.kind = kind;
  }
}

const MESSAGES: Record<ScanErrorKind, string> = {
  network: strings.scanErrors.network,
  rate_limited: strings.scanErrors.rateLimited,
  too_large: strings.scanErrors.tooLarge,
  invalid_image: strings.scanErrors.invalidImage,
  timeout: strings.scanErrors.timeout,
  unavailable: strings.scanErrors.unavailable,
};

function kindForStatus(status: number): ScanErrorKind {
  if (status === 429) return 'rate_limited';
  if (status === 413) return 'too_large';
  if (status === 400) return 'invalid_image';
  if (status === 504) return 'timeout';
  return 'unavailable'; // 403, 5xx e qualquer outro
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  // Em blocos, para não estourar a pilha com fotos de ~1 MB.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function scanImage(
  photo: Blob,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<ScanResult> {
  const imageBase64 = await blobToBase64(photo);
  // Cancelado enquanto a foto era convertida: nem começa o envio.
  signal?.throwIfAborted();
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetchImpl('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
      signal: combined,
    });
  } catch (error) {
    // Cancelado por quem chamou (saiu da tela): repassa sem traduzir.
    if (signal?.aborted) throw error;
    throw new ScanError(timeout.aborted ? 'timeout' : 'network');
  }

  if (!response.ok) throw new ScanError(kindForStatus(response.status));

  const parsed = ScanResultSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new ScanError('unavailable');
  return parsed.data;
}
