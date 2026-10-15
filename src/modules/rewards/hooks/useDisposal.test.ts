import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LAST_SCAN_KEY } from '@/modules/scanner/model/lastScan';
import { createAppStorage, type AppStorage } from '@/shared/lib/storage';
import { getLedger } from '../model/ledger';
import { useDisposal } from './useDisposal';

const NOW = new Date('2026-10-15T12:05:00.000Z');
let storage: AppStorage;

function seedScan(overrides: Record<string, string> = {}) {
  const lastScan = {
    id: crypto.randomUUID(),
    category: 'plastico',
    itemName: 'Garrafa PET',
    scannedAt: '2026-10-15T12:00:00.000Z',
    ...overrides,
  };
  storage.set(LAST_SCAN_KEY, lastScan);
  return lastScan;
}

const render = (pointId: string | null) =>
  renderHook(() => useDisposal(pointId, { storage, now: () => NOW }), { wrapper: StrictMode });

beforeEach(() => {
  const data = new Map<string, string>();
  storage = createAppStorage(() => ({
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }));
});

describe('useDisposal', () => {
  it('sem ponto → leitor de QR, sem mexer no ledger', () => {
    seedScan();
    expect(render(null).result.current).toEqual({ status: 'reader' });
    expect(getLedger(storage)).toEqual([]);
  });

  it('sucesso grava uma única entrada, mesmo no StrictMode', () => {
    const lastScan = seedScan();

    const { result } = render('escola-demo');

    expect(result.current).toMatchObject({
      status: 'success',
      entry: { scanId: lastScan.id, xp: 10, coins: 5, itemName: 'Garrafa PET' },
      wallet: { xp: 10, coins: 5 },
      leveledUp: null,
    });
    expect(getLedger(storage)).toHaveLength(1);
  });

  it('abrir o mesmo link de novo → "já foi contado", sem nova entrada', () => {
    seedScan();
    render('escola-demo').unmount();

    const { result } = render('escola-demo');

    expect(result.current).toMatchObject({ status: 'error', reason: 'already_claimed' });
    expect(getLedger(storage)).toHaveLength(1);
  });

  it('erro devolve o motivo e o último scan (para a mensagem da categoria)', () => {
    expect(render('escola-demo').result.current).toEqual({
      status: 'error',
      reason: 'no_scan',
      lastScan: null,
    });

    seedScan({ scannedAt: '2026-10-15T11:00:00.000Z' });
    expect(render('escola-demo').result.current).toMatchObject({
      status: 'error',
      reason: 'scan_expired',
      lastScan: { itemName: 'Garrafa PET' },
    });
    expect(getLedger(storage)).toEqual([]);
  });
});
