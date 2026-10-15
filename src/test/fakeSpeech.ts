// speechSynthesis falso para testes: guarda o que foi falado e deixa o teste
// decidir quando cada fala termina.

export class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

export function fakeVoice(name: string, lang: string, localService = true) {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

export function createFakeSynth(voices: SpeechSynthesisVoice[] = [fakeVoice('Luciana', 'pt-BR')]) {
  const spoken: FakeUtterance[] = [];
  let pending: FakeUtterance[] = [];

  const synth = {
    getVoices: () => voices,
    speak(utterance: SpeechSynthesisUtterance) {
      const fake = utterance as unknown as FakeUtterance;
      spoken.push(fake);
      pending.push(fake);
    },
    // Como no navegador: cancelar dispara o `error` (interrupted) das falas pendentes.
    cancel() {
      const interrupted = pending;
      pending = [];
      interrupted.forEach((u) => u.onerror?.());
    },
  };

  return {
    synth,
    spoken,
    texts: () => spoken.map((u) => u.text),
    /** Termina a fala em andamento, como se o áudio tivesse acabado. */
    finish() {
      const utterance = pending.shift();
      utterance?.onend?.();
    },
  };
}

export const FakeUtteranceCtor = FakeUtterance as unknown as new (
  text: string,
) => SpeechSynthesisUtterance;
