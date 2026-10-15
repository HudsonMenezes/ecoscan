import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createAppStorage, LocalStorageAdapter } from './LocalStorageAdapter';

const WalletSchema = z.object({ xp: z.number(), coins: z.number() });

describe('LocalStorageAdapter', () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter(localStorage);
  });

  it('grava e lê um valor válido', () => {
    storage.set('ecoscan:wallet', { xp: 10, coins: 5 });
    expect(storage.get('ecoscan:wallet', WalletSchema)).toEqual({ xp: 10, coins: 5 });
  });

  it('devolve null para chave ausente', () => {
    expect(storage.get('ecoscan:wallet', WalletSchema)).toBeNull();
  });

  it('devolve null para JSON corrompido, sem lançar exceção', () => {
    localStorage.setItem('ecoscan:wallet', '{nao é json');
    expect(storage.get('ecoscan:wallet', WalletSchema)).toBeNull();
  });

  it('devolve null quando o dado não respeita o schema', () => {
    localStorage.setItem('ecoscan:wallet', JSON.stringify({ xp: 'muito', coins: 5 }));
    expect(storage.get('ecoscan:wallet', WalletSchema)).toBeNull();
  });

  it('remove um valor', () => {
    storage.set('ecoscan:wallet', { xp: 1, coins: 1 });
    storage.remove('ecoscan:wallet');
    expect(storage.get('ecoscan:wallet', WalletSchema)).toBeNull();
  });

  it('não lança exceção quando o armazenamento recusa a gravação (cota cheia)', () => {
    const full = {
      ...localStorage,
      setItem: vi.fn(() => {
        throw new DOMException('cheio', 'QuotaExceededError');
      }),
    } as unknown as Storage;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      new LocalStorageAdapter(full).set('ecoscan:wallet', { xp: 1, coins: 1 }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('não lança exceção quando a remoção falha', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new DOMException('bloqueado', 'SecurityError');
      },
    };
    expect(() => new LocalStorageAdapter(broken).remove('ecoscan:wallet')).not.toThrow();
  });
});

describe('createAppStorage', () => {
  it('usa memória quando o localStorage está bloqueado', () => {
    const blocked = () => {
      throw new DOMException('bloqueado', 'SecurityError');
    };
    const storage = createAppStorage(blocked);

    storage.set('ecoscan:wallet', { xp: 3, coins: 2 });
    expect(storage.get('ecoscan:wallet', WalletSchema)).toEqual({ xp: 3, coins: 2 });
    storage.remove('ecoscan:wallet');
    expect(storage.get('ecoscan:wallet', WalletSchema)).toBeNull();
  });

  it('usa o localStorage do navegador por padrão', () => {
    localStorage.clear();
    createAppStorage().set('ecoscan:wallet', { xp: 1, coins: 1 });
    expect(localStorage.getItem('ecoscan:wallet')).toBe('{"xp":1,"coins":1}');
  });
});
