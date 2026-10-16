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
    stopped = false;
    aborted = false;

    constructor() {
      instances.push(this);
    }

    start() {
      this.started = true;
    }

    // No navegador, o fim chega depois (o teste chama `end()`).
    stop() {
      this.stopped = true;
    }

    abort() {
      this.aborted = true;
      this.onerror?.({ error: 'aborted' });
      this.onend?.();
    }
  }

  const last = () => instances[instances.length - 1]!;
  const hear = (...alternatives: string[]) =>
    last().onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] });
  const end = () => last().onend?.();

  return {
    Ctor: FakeRecognition as unknown as RecognitionCtor,
    instances,
    last,
    /** Só o resultado, sem o fim. */
    hear,
    end,
    /** Como no navegador: resultado e depois o fim. */
    say(...alternatives: string[]) {
      hear(...alternatives);
      end();
    },
    fail(error: string) {
      last().onerror?.({ error });
      end();
    },
    silence: end,
  };
}
