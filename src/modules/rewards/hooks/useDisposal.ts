// Liga o claimDisposal (puro) ao storage: lê o LastScan e o ledger, decide uma vez e
// grava a entrada. Quem usa deve montar o hook com `key={location.key}`, para cada
// abertura do link virar uma nova decisão.
import { useEffect, useState } from 'react';
import { getLastScan, type LastScan } from '@/modules/scanner';
import { appStorage, type AppStorage } from '@/shared/lib/storage';
import { claimDisposal, type ClaimError } from '../model/claimDisposal';
import {
  appendLedgerEntry,
  getLedger,
  getWallet,
  type LedgerEntry,
  type Wallet,
} from '../model/ledger';
import type { Level } from '../model/levels';

export type DisposalState =
  | { status: 'reader' } // sem ?ponto: falta ler o QR
  | { status: 'success'; entry: LedgerEntry; leveledUp: Level | null; wallet: Wallet }
  | { status: 'error'; reason: ClaimError; lastScan: LastScan | null };

type Options = { storage?: AppStorage; now?: () => Date; uuid?: () => string };

function decide(pointId: string | null, { storage = appStorage, now, uuid }: Options) {
  if (pointId === null) return { status: 'reader' } as const;
  const lastScan = getLastScan(storage);
  const ledger = getLedger(storage);
  const result = claimDisposal({ pointId, lastScan, ledger, now: now?.() ?? new Date(), uuid });
  if (!result.ok) return { status: 'error', reason: result.reason, lastScan } as const;
  const wallet = getWallet([...ledger, result.entry]);
  return { status: 'success', entry: result.entry, leveledUp: result.leveledUp, wallet } as const;
}

export function useDisposal(pointId: string | null, options: Options = {}): DisposalState {
  // A decisão é pura e fica no estado; gravar é efeito. Assim o StrictMode (que roda
  // inicializador e efeitos duas vezes) não transforma um descarte em "já foi contado".
  const [state] = useState<DisposalState>(() => decide(pointId, options));
  const storage = options.storage ?? appStorage;

  useEffect(() => {
    if (state.status !== 'success') return;
    // Idempotente: o mesmo scan nunca entra duas vezes no ledger.
    if (getLedger(storage).some((e) => e.scanId === state.entry.scanId)) return;
    appendLedgerEntry(state.entry, storage);
  }, [state, storage]);

  return state;
}
