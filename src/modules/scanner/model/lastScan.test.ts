import { describe, expect, it } from 'vitest';
import type { ScanResult } from '@/shared/contracts';
import { createAppStorage, type KeyValueStore } from '@/shared/lib/storage';
import { getLastScan, LAST_SCAN_KEY, saveLastScan } from './lastScan';

function memory() {
  const data = new Map<string, string>();
  const store: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return { storage: createAppStorage(() => store), data };
}

const can: ScanResult = {
  identified: true,
  itemName: 'Lata de alumínio',
  material: 'Alumínio',
  category: 'metal',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Coleta seletiva.',
  categoryReason: 'É de metal.',
  consequence: 'Desperdiça um material reciclável.',
  benefit: 'Reciclando, o material vira um produto novo e o ambiente fica mais limpo.',
  spokenSummary: 'É uma lata. Coleta seletiva.',
};

const UUID = '3b241101-e2bb-4255-8caf-4136c566a962';
const NOW = new Date('2026-10-15T12:00:00.000Z');

describe('LastScan', () => {
  it('salva id, categoria, item e data do scan válido', () => {
    const { storage } = memory();

    const saved = saveLastScan(can, { storage, now: () => NOW, uuid: () => UUID });

    expect(saved).toEqual({
      id: UUID,
      category: 'metal',
      itemName: 'Lata de alumínio',
      scannedAt: '2026-10-15T12:00:00.000Z',
    });
    expect(getLastScan(storage)).toEqual(saved);
  });

  it('não salva scan desconhecido e mantém o anterior', () => {
    const { storage } = memory();
    const previous = saveLastScan(can, { storage, now: () => NOW, uuid: () => UUID });

    const saved = saveLastScan({ ...can, category: 'desconhecido' }, { storage });

    expect(saved).toBeNull();
    expect(getLastScan(storage)).toEqual(previous);
  });

  it('cada scan ganha um id novo (dois scans do mesmo material são distintos)', () => {
    const { storage } = memory();

    const first = saveLastScan(can, { storage });
    const second = saveLastScan(can, { storage });

    expect(first?.id).not.toBe(second?.id);
    expect(getLastScan(storage)?.id).toBe(second?.id);
  });

  it('dado inválido no storage → null', () => {
    const { storage, data } = memory();
    data.set(LAST_SCAN_KEY, JSON.stringify({ id: 'x', category: 'metal' }));

    expect(getLastScan(storage)).toBeNull();
  });
});
