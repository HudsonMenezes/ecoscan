import { describe, expect, it } from 'vitest';
import type { LastScan } from '@/modules/scanner';
import { SCAN_TTL_MS, claimDisposal } from './claimDisposal';
import type { LedgerEntry } from './ledger';
import type { CollectionPoint } from './points';

const NOW = new Date('2026-10-15T12:10:00.000Z');
const ENTRY_ID = '11111111-1111-4111-8111-111111111111';
const uuid = () => ENTRY_ID;

function scan(overrides: Partial<LastScan> = {}): LastScan {
  return {
    id: crypto.randomUUID(),
    category: 'plastico',
    itemName: 'Garrafa PET',
    scannedAt: '2026-10-15T12:05:00.000Z',
    ...overrides,
  };
}

function earned(lastScan: LastScan, xp: number): LedgerEntry {
  return {
    id: crypto.randomUUID(),
    type: 'earn',
    scanId: lastScan.id,
    pointId: 'escola-demo',
    category: lastScan.category,
    itemName: lastScan.itemName,
    xp,
    coins: 0,
    createdAt: '2026-10-15T11:00:00.000Z',
  };
}

const claim = (input: Partial<Parameters<typeof claimDisposal>[0]> = {}) =>
  claimDisposal({ pointId: 'escola-demo', lastScan: scan(), ledger: [], now: NOW, uuid, ...input });

describe('claimDisposal', () => {
  it('caminho feliz: cria a entrada do ledger com XP e moedas da categoria', () => {
    const lastScan = scan({ category: 'pilhas_baterias', itemName: 'Pilha AA' });

    const result = claim({ lastScan });

    expect(result).toEqual({
      ok: true,
      leveledUp: null,
      entry: {
        id: ENTRY_ID,
        type: 'earn',
        scanId: lastScan.id,
        pointId: 'escola-demo',
        category: 'pilhas_baterias',
        itemName: 'Pilha AA',
        xp: 20,
        coins: 10,
        createdAt: NOW.toISOString(),
      },
    });
  });

  it('sem uuid injetado, a entrada ganha um uuid novo', () => {
    const result = claimDisposal({
      pointId: 'escola-demo',
      lastScan: scan(),
      ledger: [],
      now: NOW,
    });

    expect(result.ok && result.entry.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    ['unknown_point', { pointId: 'nao-existe' }],
    ['no_scan', { lastScan: null }],
    ['scan_expired', { lastScan: scan({ scannedAt: '2026-10-15T11:59:59.999Z' }) }],
    ['category_not_accepted', { lastScan: scan({ category: 'desconhecido' }) }],
  ] as const)('%s', (reason, input) => {
    expect(claim(input)).toEqual({ ok: false, reason });
  });

  it('category_not_accepted: ponto que só recebe algumas categorias', () => {
    const points: CollectionPoint[] = [{ id: 'escola-demo', name: 'Papel', accepts: ['papel'] }];

    expect(claim({ points })).toEqual({ ok: false, reason: 'category_not_accepted' });
    expect(claim({ points, lastScan: scan({ category: 'papel' }) }).ok).toBe(true);
  });

  it('already_claimed: o mesmo scan não é recompensado duas vezes', () => {
    const lastScan = scan();
    expect(claim({ lastScan, ledger: [earned(lastScan, 10)] })).toEqual({
      ok: false,
      reason: 'already_claimed',
    });
  });

  it('scans diferentes do mesmo material são ambos recompensados', () => {
    const first = scan({ itemName: 'Garrafa PET' });
    const second = scan({ itemName: 'Garrafa PET' });

    expect(claim({ lastScan: second, ledger: [earned(first, 10)] }).ok).toBe(true);
  });

  it('expira exatamente em 10 minutos: no limite ainda vale, 1 ms depois não', () => {
    const scannedAt = new Date(NOW.getTime() - SCAN_TTL_MS).toISOString();
    const late = new Date(NOW.getTime() - SCAN_TTL_MS - 1).toISOString();

    expect(SCAN_TTL_MS).toBe(10 * 60 * 1000);
    expect(claim({ lastScan: scan({ scannedAt }) }).ok).toBe(true);
    expect(claim({ lastScan: scan({ scannedAt: late }) })).toEqual({
      ok: false,
      reason: 'scan_expired',
    });
  });

  it('scan com data no futuro (relógio do aparelho mexido) é aceito, desde que não repetido', () => {
    expect(claim({ lastScan: scan({ scannedAt: '2026-10-15T12:30:00.000Z' }) }).ok).toBe(true);
  });

  it('a ordem das checagens segue a spec: ponto antes de scan', () => {
    expect(claim({ pointId: 'nao-existe', lastScan: null })).toEqual({
      ok: false,
      reason: 'unknown_point',
    });
  });

  it('avisa quando o descarte sobe o nível', () => {
    const old = scan();
    const result = claim({ ledger: [earned(old, 45)] }); // 45 + 10 = 55 → Broto

    expect(result.ok && result.leveledUp?.name).toBe('Broto');
  });

  it('sem subir de nível → leveledUp null', () => {
    const old = scan();
    const result = claim({ ledger: [earned(old, 10)] });

    expect(result.ok && result.leveledUp).toBeNull();
  });
});
