import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { createAutoTts } from './autoTts';
import { createBrowserTts, type Tts, type TtsProvider } from './browserTts';
import { createOpenAITts } from './openaiTts';

export type Speech = {
  speak(text: string): Promise<void>;
  stop(): void;
  speaking: boolean;
  supported: boolean;
  provider: TtsProvider;
};

// Um motor só para o app inteiro: duas falas nunca se sobrepõem. Os testes
// trocam o motor por este contexto.
export const TtsContext = createContext<Tts | null>(null);

let defaultTts: Tts | null = null;
const getDefaultTts = () =>
  (defaultTts ??= createAutoTts({
    browser: createBrowserTts(),
    openai: createOpenAITts(),
    forced: import.meta.env.VITE_TTS_PROVIDER,
  }));

export function useSpeech(): Speech {
  const tts = useContext(TtsContext) ?? getDefaultTts();
  const speaking = useSyncExternalStore(tts.subscribe, tts.isSpeaking);
  const speak = useCallback((text: string) => tts.speak(text), [tts]);
  const stop = useCallback(() => tts.stop(), [tts]);
  return { speak, stop, speaking, supported: tts.supported, provider: tts.provider() };
}
