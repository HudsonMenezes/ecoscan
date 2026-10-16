import type { Page } from '@playwright/test';

type SpeechWindow = Window & {
  spoken: string[];
  hear: (...alternatives: string[]) => void;
  listening: () => boolean;
};

// speechSynthesis e SpeechRecognition falsos, injetados antes do app carregar:
// a fala vira uma lista de textos, e o teste decide o que o microfone "ouviu".
export async function installFakeSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as SpeechWindow;
    w.spoken = [];

    const voice = {
      name: 'Falsa',
      lang: 'pt-BR',
      localService: true,
      default: true,
      voiceURI: 'f',
    };
    // O SpeechSynthesisUtterance real recusa uma voz que não veio do navegador.
    class FakeUtterance {
      lang = '';
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [voice],
        speak: (utterance: SpeechSynthesisUtterance) => void w.spoken.push(utterance.text),
        cancel: () => {},
      },
    });

    type Handlers = {
      onresult: ((event: unknown) => void) | null;
      onerror: ((event: unknown) => void) | null;
      onend: (() => void) | null;
    };
    let active: Handlers | null = null;
    const setActive = (recognition: Handlers | null) => {
      active = recognition;
    };

    class FakeRecognition implements Handlers {
      lang = '';
      interimResults = true;
      continuous = true;
      maxAlternatives = 1;
      onresult: Handlers['onresult'] = null;
      onerror: Handlers['onerror'] = null;
      onend: Handlers['onend'] = null;
      start() {
        setActive(this);
      }
      stop() {}
      abort() {
        if (active === this) active = null;
        this.onerror?.({ error: 'aborted' });
        this.onend?.();
      }
    }
    // O Chromium já tem o SpeechRecognition sem prefixo: troca os dois.
    for (const name of ['SpeechRecognition', 'webkitSpeechRecognition']) {
      Object.defineProperty(window, name, { configurable: true, value: FakeRecognition });
    }

    w.listening = () => active !== null;
    w.hear = (...alternatives) => {
      const recognition = active;
      if (!recognition) throw new Error('o microfone não está ouvindo');
      active = null;
      recognition.onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] });
      recognition.onend?.();
    };
  });
}

/** Toca no 🎤 e "fala" a frase. */
export async function sayCommand(page: Page, phrase: string) {
  await page.getByRole('button', { name: 'Falar um comando' }).click();
  await page.waitForFunction(() => (window as unknown as SpeechWindow).listening());
  await page.evaluate((text) => (window as unknown as SpeechWindow).hear(text), phrase);
}

export const spokenTexts = (page: Page) =>
  page.evaluate(() => [...(window as unknown as SpeechWindow).spoken]);
