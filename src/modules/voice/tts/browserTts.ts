// Fala pelo speechSynthesis do navegador (provedor padrão da SPEC-voice).
// As dependências entram por parâmetro, para testar sem navegador.

export const SPEECH_RATE = 0.95;
const LANG = 'pt-BR';

export type Tts = {
  readonly supported: boolean;
  /** Para o que estiver falando e fala o texto. Resolve quando termina, é interrompida ou falha. */
  speak(text: string): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
  subscribe(onChange: () => void): () => void;
};

type SynthLike = Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'>;
type UtteranceCtor = new (text: string) => SpeechSynthesisUtterance;

const isPtBr = (voice: SpeechSynthesisVoice) =>
  voice.lang.replace('_', '-').toLowerCase() === 'pt-br';

// Prioridade para vozes locais (sem rede) e, entre elas, as "naturais"/"neurais".
export function pickPtBrVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ptBr = voices.filter(isPtBr);
  const natural = (voice: SpeechSynthesisVoice) => /natural|neural/i.test(voice.name);
  return (
    ptBr.find((v) => v.localService && natural(v)) ??
    ptBr.find((v) => v.localService) ??
    ptBr.find(natural) ??
    ptBr[0] ??
    null
  );
}

export function createBrowserTts(
  synth: SynthLike | undefined = globalThis.speechSynthesis,
  Utterance: UtteranceCtor | undefined = globalThis.SpeechSynthesisUtterance,
): Tts {
  const listeners = new Set<() => void>();
  // Só a fala mais recente conta: o `end` de uma fala cancelada chega depois do
  // início da próxima e não pode apagar o "falando".
  let current: SpeechSynthesisUtterance | null = null;

  const setCurrent = (utterance: SpeechSynthesisUtterance | null) => {
    current = utterance;
    listeners.forEach((listener) => listener());
  };

  if (!synth || !Utterance) {
    return {
      supported: false,
      speak: () => Promise.resolve(),
      stop: () => {},
      isSpeaking: () => false,
      subscribe: () => () => {},
    };
  }

  return {
    supported: true,
    speak(text) {
      synth.cancel();
      if (!text.trim()) {
        setCurrent(null);
        return Promise.resolve();
      }
      const utterance = new Utterance(text);
      utterance.lang = LANG;
      utterance.rate = SPEECH_RATE;
      // As vozes podem ainda não ter carregado; sem voz, o navegador usa a padrão do `lang`.
      const voice = pickPtBrVoice(synth.getVoices());
      if (voice) utterance.voice = voice;

      return new Promise((resolve) => {
        const finish = () => {
          if (current === utterance) setCurrent(null);
          resolve();
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        setCurrent(utterance);
        synth.speak(utterance);
      });
    },
    stop() {
      synth.cancel();
      setCurrent(null);
    },
    isSpeaking: () => current !== null,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
  };
}
