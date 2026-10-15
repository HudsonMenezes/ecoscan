// Último scan válido: o rewards usa para liberar o descarte pelo QR.
import { z } from 'zod';
import { CategorySchema, type ScanResult } from '@/shared/contracts';
import { appStorage, type AppStorage } from '@/shared/lib/storage';

export const LAST_SCAN_KEY = 'ecoscan:last-scan';

export const LastScanSchema = z.object({
  id: z.uuid(),
  category: CategorySchema,
  itemName: z.string().max(60),
  scannedAt: z.iso.datetime(),
});
export type LastScan = z.infer<typeof LastScanSchema>;

export function getLastScan(storage: AppStorage = appStorage): LastScan | null {
  return storage.get(LAST_SCAN_KEY, LastScanSchema);
}

// `desconhecido` não é salvo: não há o que descartar e não pode gerar recompensa.
export function saveLastScan(
  result: ScanResult,
  {
    storage = appStorage,
    now = () => new Date(),
    uuid = () => crypto.randomUUID(),
  }: { storage?: AppStorage; now?: () => Date; uuid?: () => string } = {},
): LastScan | null {
  if (result.category === 'desconhecido') return null;
  const lastScan: LastScan = {
    id: uuid(),
    category: result.category,
    itemName: result.itemName,
    scannedAt: now().toISOString(),
  };
  storage.set(LAST_SCAN_KEY, lastScan);
  return lastScan;
}
