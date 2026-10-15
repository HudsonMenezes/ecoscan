import { describe, expect, it, vi } from 'vitest';
import { FakeUtteranceCtor, createFakeSynth, fakeVoice } from '@/test/fakeSpeech';
import { chooseProvider, createAutoTts } from './autoTts';
import { createBrowserTts, type Tts } from './browserTts';

describe('chooseProvider', () => {
  const ptBr = [fakeVoice('Luciana', 'pt-BR')];
  const english = [fakeVoice('Samantha', 'en-US')];

  it.each([
    ['com voz pt-BR → navegador', true, ptBr, undefined, 'browser'],
    ['sem voz pt-BR → OpenAI', true, english, undefined, 'openai'],
    ['sem speechSynthesis → OpenAI', false, [], undefined, 'openai'],
    ['vozes ainda não carregadas → navegador', true, [], undefined, 'browser'],
    ['VITE_TTS_PROVIDER=openai força a OpenAI', true, ptBr, 'openai', 'openai'],
    ['VITE_TTS_PROVIDER=browser segue a regra', true, english, 'browser', 'openai'],
  ] as const)('%s', (_, supported, voices, forced, expected) => {
    expect(chooseProvider(supported, [...voices], forced)).toBe(expected);
  });
});

function fakeOpenai(): Tts & { spoken: string[] } {
  const spoken: string[] = [];
  return {
    spoken,
    supported: true,
    provider: () => 'openai',
    speak: vi.fn(async (text: string) => void spoken.push(text)),
    stop: vi.fn(),
    isSpeaking: () => false,
    subscribe: () => () => {},
  };
}

describe('createAutoTts', () => {
  it('aparelho sem voz pt-BR: a reserva da OpenAI fala sozinha', async () => {
    const fake = createFakeSynth([fakeVoice('Samantha', 'en-US')]);
    const openai = fakeOpenai();
    const tts = createAutoTts({
      browser: createBrowserTts(fake.synth, FakeUtteranceCtor),
      openai,
      synth: fake.synth,
    });

    expect(tts.provider()).toBe('openai');
    await tts.speak('Olá');

    expect(openai.spoken).toEqual(['Olá']);
    expect(fake.spoken).toEqual([]);
  });

  it('com voz pt-BR: fala pelo navegador e para a OpenAI', () => {
    const fake = createFakeSynth();
    const openai = fakeOpenai();
    const tts = createAutoTts({
      browser: createBrowserTts(fake.synth, FakeUtteranceCtor),
      openai,
      synth: fake.synth,
    });

    void tts.speak('Olá');

    expect(fake.texts()).toEqual(['Olá']);
    expect(openai.stop).toHaveBeenCalled();
    expect(tts.isSpeaking()).toBe(true);
  });

  it('é sempre "suportado": sem speechSynthesis, a OpenAI cobre', () => {
    const tts = createAutoTts({
      browser: createBrowserTts(undefined, undefined),
      openai: fakeOpenai(),
      synth: undefined,
    });
    expect(tts.supported).toBe(true);
    expect(tts.provider()).toBe('openai');
  });
});
