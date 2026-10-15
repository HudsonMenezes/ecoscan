// Modo voz: com ele ligado, cada tela fala sozinha ao abrir. Fica salvo no aparelho.
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { appStorage, type AppStorage, type StorageKey } from '@/shared/lib/storage';

export const VOICE_SETTINGS_KEY: StorageKey = 'ecoscan:voice-settings';

const voiceSettingsSchema = z.object({ voiceMode: z.boolean() });
export type VoiceSettings = z.infer<typeof voiceSettingsSchema>;

export function createVoiceSettingsStore(storage: AppStorage) {
  const listeners = new Set<() => void>();
  return {
    // Booleano (e não o objeto) para o useSyncExternalStore comparar por valor.
    getVoiceMode: () => storage.get(VOICE_SETTINGS_KEY, voiceSettingsSchema)?.voiceMode ?? false,
    setVoiceMode(voiceMode: boolean) {
      storage.set<VoiceSettings>(VOICE_SETTINGS_KEY, { voiceMode });
      listeners.forEach((listener) => listener());
    },
    subscribe(onChange: () => void) {
      listeners.add(onChange);
      return () => void listeners.delete(onChange);
    },
  };
}

export type VoiceSettingsStore = ReturnType<typeof createVoiceSettingsStore>;

export const voiceSettings = createVoiceSettingsStore(appStorage);

export function useVoiceMode(store: VoiceSettingsStore = voiceSettings) {
  const voiceMode = useSyncExternalStore(store.subscribe, store.getVoiceMode);
  return [voiceMode, store.setVoiceMode] as const;
}
