// Ledger: lista que só recebe novas entradas. O saldo nunca é salvo como um número solto;
// ele é sempre calculado daqui, o que facilita migrar para o Supabase e incluir resgates.
import { z } from 'zod';
import { CategorySchema } from '@/shared/contracts';
import { appStorage, type AppStorage } from '@/shared/lib/storage';
import { getNextLevel, levelForXp, levelProgress, type Level } from './levels';

export const LEDGER_KEY = 'ecoscan:ledger';

export const LedgerEntrySchema = z.object({
  id: z.uuid(),
  type: z.literal('earn'), // futuro: 'redeem'
  scanId: z.uuid(), // LastScan.id: impede recompensar o mesmo scan duas vezes
  pointId: z.string().min(1),
  category: CategorySchema,
  itemName: z.string(),
  xp: z.int().nonnegative(),
  coins: z.int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

const LedgerSchema = z.array(LedgerEntrySchema);

export type Wallet = {
  xp: number;
  coins: number;
  level: Level;
  nextLevel: Level | null;
  progress: number; // 0..1 até o próximo nível
};

// Ausente ou inválido (editado à mão, versão antiga) → vazio, sem derrubar a tela.
export function getLedger(storage: AppStorage = appStorage): LedgerEntry[] {
  return storage.get(LEDGER_KEY, LedgerSchema) ?? [];
}

export function appendLedgerEntry(entry: LedgerEntry, storage: AppStorage = appStorage): void {
  storage.set(LEDGER_KEY, [...getLedger(storage), entry]);
}

export function getWallet(ledger: readonly LedgerEntry[]): Wallet {
  const xp = ledger.reduce((sum, e) => sum + e.xp, 0);
  const coins = ledger.reduce((sum, e) => sum + e.coins, 0);
  const level = levelForXp(xp);
  return { xp, coins, level, nextLevel: getNextLevel(level), progress: levelProgress(xp) };
}
