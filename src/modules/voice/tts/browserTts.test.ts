import { describe, expect, it, vi } from 'vitest';
import { FakeUtteranceCtor, createFakeSynth, fakeVoice } from '@/test/fakeSpeech';
import { SPEECH_RATE, createBrowserTts, pickPtBrVoice } from './browserTts';

describe('pickPtBrVoice', () => {
  it.each([
    ['sem vozes', [], null],
    ['sem pt-BR', [fakeVoice('Samantha', 'en-US'), fakeVoice('Joana', 'pt-PT')], null],
    ['aceita pt_BR (Android antigo)', [fakeVoice('Google', 'pt_BR')], 'Google'],
    [
      'prefere a voz local',
      [fakeVoice('Online', 'pt-BR', false), fakeVoice('Local', 'pt-BR')],
      'Local',
    ],
    [
      'prefere a local "natural"',
      [fakeVoice('Local', 'pt-BR'), fakeVoice('Microsoft Francisca Natural', 'pt-BR')],
      'Microsoft Francisca Natural',
    ],
    [
      'sem local, prefere a natural',
      [fakeVoice('Online', 'pt-BR', false), fakeVoice('Thalita Neural', 'pt-BR', false)],
      'Thalita Neural',
    ],
    ['qualquer pt-BR na falta de outra', [fakeVoice('Online', 'PT-BR', false)], 'Online'],
  ])('%s', (_, voices, expected) => {
    expect(pickPtBrVoice(voices)?.name ?? null).toBe(expected);
  });
});

describe('createBrowserTts', () => {
  it('fala em pt-BR, na velocidade da spec, com a melhor voz', async () => {
    const fake = createFakeSynth([fakeVoice('Samantha', 'en-US'), fakeVoice('Luciana', 'pt-BR')]);
    const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);

    const done = tts.speak('Olá');
    const [utterance] = fake.spoken;
    expect(utterance).toMatchObject({ text: 'Olá', lang: 'pt-BR', rate: SPEECH_RATE });
    expect(utterance?.voice?.name).toBe('Luciana');

    fake.finish();
    await expect(done).resolves.toBeUndefined();
  });

  it('sem vozes carregadas ainda, fala mesmo assim (o navegador usa a padrão do idioma)', () => {
    const fake = createFakeSynth([]);
    createBrowserTts(fake.synth, FakeUtteranceCtor).speak('Olá');
    expect(fake.spoken[0]).toMatchObject({ lang: 'pt-BR', voice: null });
  });

  it('avisa quando começa e quando termina de falar', () => {
    const fake = createFakeSynth();
    const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);
    const onChange = vi.fn();
    tts.subscribe(onChange);

    void tts.speak('Olá');
    expect(tts.isSpeaking()).toBe(true);
    fake.finish();
    expect(tts.isSpeaking()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('uma fala nova interrompe a anterior, e o fim da antiga não apaga o "falando"', async () => {
    const fake = createFakeSynth();
    const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);

    const first = tts.speak('primeira');
    void tts.speak('segunda');

    await expect(first).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(true);
    expect(fake.texts()).toEqual(['primeira', 'segunda']);
  });

  it('stop cancela e resolve a fala em andamento', async () => {
    const fake = createFakeSynth();
    const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);

    const done = tts.speak('Olá');
    tts.stop();

    await expect(done).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
  });

  it('texto vazio não fala nada', async () => {
    const fake = createFakeSynth();
    await createBrowserTts(fake.synth, FakeUtteranceCtor).speak('   ');
    expect(fake.spoken).toEqual([]);
  });

  it('sem speechSynthesis (navegador sem suporte), não quebra', async () => {
    const tts = createBrowserTts(undefined, undefined);
    expect(tts.supported).toBe(false);
    await expect(tts.speak('Olá')).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
  });
});
