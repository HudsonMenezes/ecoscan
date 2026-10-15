// Escolhe quem fala: a voz do navegador quando o aparelho tem voz pt-BR, a
// reserva da OpenAI quando não tem (ou quando VITE_TTS_PROVIDER=openai).
import { pickPtBrVoice, type Tts, type TtsProvider } from './browserTts';

type VoiceList = Pick<SpeechSynthesis, 'getVoices'>;

export function chooseProvider(
  browserSupported: boolean,
  voices: SpeechSynthesisVoice[],
  forced?: string,
): TtsProvider {
  if (forced === 'openai' || !browserSupported) return 'openai';
  // Lista vazia: as vozes ainda não carregaram (o Chrome carrega depois). Quase todo
  // celular tem voz pt-BR, então o navegador fica, em vez de gastar com a OpenAI.
  if (voices.length === 0) return 'browser';
  return pickPtBrVoice(voices) ? 'browser' : 'openai';
}

export function createAutoTts({
  browser,
  openai,
  synth = globalThis.speechSynthesis,
  forced,
}: {
  browser: Tts;
  openai: Tts;
  synth?: VoiceList;
  forced?: string;
}): Tts {
  const provider = () => chooseProvider(browser.supported, synth?.getVoices() ?? [], forced);
  const engines = { browser, openai };

  return {
    supported: true,
    provider,
    speak(text) {
      const chosen = provider();
      engines[chosen === 'browser' ? 'openai' : 'browser'].stop();
      return engines[chosen].speak(text);
    },
    stop() {
      browser.stop();
      openai.stop();
    },
    isSpeaking: () => browser.isSpeaking() || openai.isSpeaking(),
    subscribe(onChange) {
      const offBrowser = browser.subscribe(onChange);
      const offOpenai = openai.subscribe(onChange);
      return () => {
        offBrowser();
        offOpenai();
      };
    },
  };
}
