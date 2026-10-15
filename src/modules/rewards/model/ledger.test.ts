import { describe, expect, it } from 'vitest';
import { createAppStorage, type KeyValueStore } from '@/shared/lib/storage';
import { LEDGER_KEY, appendLedgerEntry, getLedger, getWallet, type LedgerEntry } from './ledger';

function memoryStorage() {
  const data = new Map<string, string>();
  const store: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return { storage: createAppStorage(() => store), data };
}

let seq = 0;
function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  seq += 1;
  return {
    id: crypto.randomUUID(),
    type: 'earn',
    scanId: crypto.randomUUID(),
    pointId: 'escola-demo',
    category: 'plastico',
    itemName: `Garrafa PET ${seq}`,
    xp: 10,
    coins: 5,
    createdAt: '2026-10-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('getWallet', () => {
  it('ledger vazio → carteira zerada no primeiro nível', () => {
    const wallet = getWallet([]);
    expect(wallet).toMatchObject({ xp: 0, coins: 0, progress: 0 });
    expect(wallet.level.name).toBe('Semente');
    expect(wallet.nextLevel?.name).toBe('Broto');
  });

  it('soma XP e moedas de todas as entradas', () => {
    const wallet = getWallet([entry(), entry({ xp: 20, coins: 10 }), entry({ xp: 5, coins: 2 })]);
    expect(wallet).toMatchObject({ xp: 35, coins: 17 });
    expect(wallet.progress).toBeCloseTo(35 / 50);
  });

  it.each([
    [49, 'Semente', 'Broto'],
    [50, 'Broto', 'Muda'],
    [799, 'Floresta', 'Guardião do Planeta'],
    [800, 'Guardião do Planeta', null],
  ])('fronteira: %i XP → %s (próximo: %s)', (xp, level, next) => {
    const wallet = getWallet([entry({ xp, coins: 0 })]);
    expect(wallet.level.name).toBe(level);
    expect(wallet.nextLevel?.name ?? null).toBe(next);
  });

  it('progresso fica entre 0 e 1, e é 1 no último nível', () => {
    expect(getWallet([entry({ xp: 799 })]).progress).toBeLessThan(1);
    expect(getWallet([entry({ xp: 900 })]).progress).toBe(1);
  });
});

describe('ledger no storage', () => {
  it('sem nada salvo → lista vazia', () => {
    const { storage } = memoryStorage();
    expect(getLedger(storage)).toEqual([]);
  });

  it('append guarda no fim e preserva as entradas antigas', () => {
    const { storage } = memoryStorage();
    const first = entry();
    const second = entry({ category: 'pilhas_baterias', xp: 20, coins: 10 });

    appendLedgerEntry(first, storage);
    appendLedgerEntry(second, storage);

    expect(getLedger(storage)).toEqual([first, second]);
  });

  it.each([
    ['JSON quebrado', '{oops'],
    ['não é lista', '{"xp":9999}'],
    ['entrada com XP negativo', JSON.stringify([{ ...entry(), xp: -100 }])],
    ['categoria inexistente', JSON.stringify([{ ...entry(), category: 'ouro' }])],
    ['tipo desconhecido', JSON.stringify([{ ...entry(), type: 'gift' }])],
  ])('ledger inválido (%s) → carteira vazia, sem erro', (_, raw) => {
    const { storage, data } = memoryStorage();
    data.set(LEDGER_KEY, raw);

    const ledger = getLedger(storage);

    expect(ledger).toEqual([]);
    expect(getWallet(ledger)).toMatchObject({ xp: 0, coins: 0 });
  });
});
