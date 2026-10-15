import type { ZodType } from 'zod';
import type { AppStorage, StorageKey } from './AppStorage';

/** Só o que o adaptador usa do Web Storage; facilita o fallback em memória. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export class LocalStorageAdapter implements AppStorage {
  private readonly storage: KeyValueStore;

  constructor(storage: KeyValueStore) {
    this.storage = storage;
  }

  get<T>(key: StorageKey, schema: ZodType<T>): T | null {
    try {
      const raw = this.storage.getItem(key);
      if (raw === null) return null;
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  set<T>(key: StorageKey, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Cota cheia ou modo privado: o app segue funcionando, só sem persistir.
      console.warn(`[storage] não foi possível gravar ${key}`, error);
    }
  }

  remove(key: StorageKey): void {
    try {
      this.storage.removeItem(key);
    } catch {
      // Mesmo motivo do set: falha de armazenamento não pode derrubar a tela.
    }
  }
}

function createMemoryStorage(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

/** Usa o localStorage quando o navegador permite; senão, memória (dados somem ao fechar). */
export function createAppStorage(
  getStorage: () => KeyValueStore = () => window.localStorage,
): AppStorage {
  try {
    return new LocalStorageAdapter(getStorage());
  } catch {
    return new LocalStorageAdapter(createMemoryStorage());
  }
}
