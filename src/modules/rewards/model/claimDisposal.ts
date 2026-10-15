// Regras do descarte pelo QR. Pura: storage, relógio e uuid chegam de fora.
import type { LastScan } from '@/modules/scanner';
import { getWallet, type LedgerEntry } from './ledger';
import type { Level } from './levels';
import { COLLECTION_POINTS, acceptsCategory, findPoint, type CollectionPoint } from './points';
import { rewardFor } from './rewardRules';

export const SCAN_TTL_MS = 10 * 60 * 1000;

export type ClaimError =
  'unknown_point' | 'no_scan' | 'scan_expired' | 'already_claimed' | 'category_not_accepted';

export type ClaimResult =
  { ok: true; entry: LedgerEntry; leveledUp: Level | null } | { ok: false; reason: ClaimError };

export type ClaimInput = {
  pointId: string;
  lastScan: LastScan | null;
  ledger: readonly LedgerEntry[];
  now: Date;
  uuid?: () => string;
  points?: readonly CollectionPoint[];
};

const fail = (reason: ClaimError): ClaimResult => ({ ok: false, reason });

export function claimDisposal({
  pointId,
  lastScan,
  ledger,
  now,
  uuid = () => crypto.randomUUID(),
  points = COLLECTION_POINTS,
}: ClaimInput): ClaimResult {
  const point = findPoint(pointId, points);
  if (!point) return fail('unknown_point');
  if (!lastScan) return fail('no_scan');
  if (now.getTime() - Date.parse(lastScan.scannedAt) > SCAN_TTL_MS) return fail('scan_expired');
  if (ledger.some((e) => e.scanId === lastScan.id)) return fail('already_claimed');
  const reward = rewardFor(lastScan.category);
  if (!reward || !acceptsCategory(point, lastScan.category)) return fail('category_not_accepted');

  const entry: LedgerEntry = {
    id: uuid(),
    type: 'earn',
    scanId: lastScan.id,
    pointId: point.id,
    category: lastScan.category,
    itemName: lastScan.itemName,
    xp: reward.xp,
    coins: reward.coins,
    createdAt: now.toISOString(),
  };
  return { ok: true, entry, leveledUp: detectLevelUp(ledger, entry) };
}

function detectLevelUp(ledger: readonly LedgerEntry[], entry: LedgerEntry): Level | null {
  const before = getWallet(ledger).level;
  const after = getWallet([...ledger, entry]).level;
  return after.number > before.number ? after : null;
}
