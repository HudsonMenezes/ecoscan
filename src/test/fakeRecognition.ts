// SpeechRecognition falso para testes: o teste decide o que foi "ouvido".
import type { Recognition, RecognitionCtor } from '@/modules/voice/stt/useVoiceCommand';

export function createFakeRecognition() {
  const instances: FakeRecognition[] = [];

  class FakeRecognition implements Recognition {
    lang = '';
    interimResults = true;
    continuous = true;
    maxAlternatives = 1;
    onresult: Recognition['onresult'] = null;
    onerror: Recognition['onerror'] = null;
    onend: Recognition['onend'] = null;
    started = false;
    aborted = false;

    constructor() {
      instances.push(this);
    }

    start() {
      this.started = true;
    }

    abort() {
      this.aborted = true;
      this.onerror?.({ error: 'aborted' });
      this.onend?.();
    }
  }

  const last = () => instances[instances.length - 1]!;

  return {
    Ctor: FakeRecognition as unknown as RecognitionCtor,
    instances,
    last,
    /** Como no navegador: resultado e depois o fim. */
    say(...alternatives: string[]) {
      const recognition = last();
      recognition.onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] });
      recognition.onend?.();
    },
    fail(error: string) {
      const recognition = last();
      recognition.onerror?.({ error });
      recognition.onend?.();
    },
    silence() {
      last().onend?.();
    },
  };
}
