// Primeira visita: a tela de boas-vindas aparece uma vez por aparelho.
import { z } from 'zod';
import { appStorage, type AppStorage, type StorageKey } from '@/shared/lib/storage';

export const WELCOME_KEY: StorageKey = 'ecoscan:welcome';

const welcomeSchema = z.object({ seen: z.literal(true) });

export function hasSeenWelcome(storage: AppStorage = appStorage): boolean {
  return storage.get(WELCOME_KEY, welcomeSchema) !== null;
}

export function markWelcomeSeen(storage: AppStorage = appStorage): void {
  storage.set(WELCOME_KEY, { seen: true });
}
