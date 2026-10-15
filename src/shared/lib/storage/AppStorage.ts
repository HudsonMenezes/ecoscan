import type { ZodType } from 'zod';

export type StorageKey = `ecoscan:${string}`;

/**
 * Armazenamento local do app. Hoje é localStorage; no futuro pode ser Supabase
 * sem mudar quem consome. Leituras nunca lançam exceção: ausente ou inválido → null.
 */
export interface AppStorage {
  get<T>(key: StorageKey, schema: ZodType<T>): T | null;
  set<T>(key: StorageKey, value: T): void;
  remove(key: StorageKey): void;
}
