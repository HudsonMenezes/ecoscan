import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useScreen } from '@/shared/lib/screen';
import { FakeUtteranceCtor, createFakeSynth } from '@/test/fakeSpeech';
import { VOICE_SETTINGS_KEY, voiceSettings } from '../model/voiceSettings';
import { createBrowserTts } from '../tts/browserTts';
import { TtsContext } from '../tts/useSpeech';
import { VoiceAutoSpeak, VoiceDock } from './VoiceDock';

const { voice } = strings;

function Screen({ speech }: { speech: string }) {
  useScreen({ speech });
  return null;
}

function setup({ speech = 'Tela inicial', compact = false } = {}) {
  const fake = createFakeSynth();
  const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);
  const ui = (text: string) => (
    <StrictMode>
      <MemoryRouter>
        <TtsContext value={tts}>
          <ScreenProvider>
            <VoiceAutoSpeak />
            <VoiceDock compact={compact} />
            {text && <Screen key={text} speech={text} />}
          </ScreenProvider>
        </TtsContext>
      </MemoryRouter>
    </StrictMode>
  );
  const view = render(ui(speech));
  return { fake, navigate: (text: string) => view.rerender(ui(text)) };
}

const listenButton = () => screen.getByRole('button', { name: voice.listen });
const modeButton = () => screen.getByRole('button', { name: voice.voiceMode });

beforeEach(() => {
  localStorage.clear();
});

describe('VoiceDock', () => {
  // Pedido do Hudson (2026-10-16): só a cor e a onda não deixam claro que algo está ligado.
  it('escreve embaixo de cada botão o que ele faz e quando está ligado', async () => {
    setup();
    expect(screen.getByText(voice.captions.mode)).toBeVisible();
    expect(screen.getByText(voice.captions.listen)).toBeVisible();

    await userEvent.click(modeButton());
    expect(screen.getByText(voice.captions.modeOn)).toBeVisible();
    expect(screen.getByText(voice.captions.stop)).toBeVisible(); // ligar o Modo voz já fala
  });

  it('🔊 lê a fala da tela atual', async () => {
    const { fake } = setup();
    await userEvent.click(listenButton());
    expect(fake.texts()).toEqual(['Tela inicial']);
  });

  it('um segundo toque no 🔊 para a fala', async () => {
    const { fake } = setup();
    await userEvent.click(listenButton());

    await userEvent.click(screen.getByRole('button', { name: voice.stop }));

    expect(listenButton()).toBeInTheDocument();
    expect(fake.texts()).toEqual(['Tela inicial']);
  });

  it('volta ao 🔊 quando a fala termina sozinha', async () => {
    const { fake } = setup();
    await userEvent.click(listenButton());
    act(() => fake.finish());
    expect(listenButton()).toBeInTheDocument();
  });

  it('Modo voz desligado: trocar de tela não fala e para a fala anterior', async () => {
    const { fake, navigate } = setup();
    await userEvent.click(listenButton());

    navigate('Carteira');

    expect(fake.texts()).toEqual(['Tela inicial']);
    expect(listenButton()).toBeInTheDocument();
  });

  it('ligar o Modo voz fala a tela atual, e depois cada tela fala ao abrir', async () => {
    const { fake, navigate } = setup();
    expect(modeButton()).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(modeButton());
    expect(modeButton()).toHaveAttribute('aria-pressed', 'true');
    expect(fake.texts()).toEqual(['Tela inicial']);

    navigate('Carteira');
    navigate('Tela inicial');
    expect(fake.texts()).toEqual(['Tela inicial', 'Carteira', 'Tela inicial']);
  });

  it('o Modo voz fica salvo, e com ele ligado a tela fala ao abrir o app', () => {
    voiceSettings.setVoiceMode(true);
    expect(JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY)!)).toEqual({ voiceMode: true });

    const { fake } = setup();

    expect(modeButton()).toHaveAttribute('aria-pressed', 'true');
    expect(fake.texts()).toEqual(['Tela inicial']);
  });

  it('desligar o Modo voz para a fala', async () => {
    voiceSettings.setVoiceMode(true);
    setup();

    await userEvent.click(modeButton());

    expect(modeButton()).toHaveAttribute('aria-pressed', 'false');
    expect(listenButton()).toBeInTheDocument();
    expect(localStorage.getItem(VOICE_SETTINGS_KEY)).toBe('{"voiceMode":false}');
  });

  it('compacto (scanner): só o 🔊', () => {
    setup({ compact: true });
    expect(listenButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: voice.voiceMode })).not.toBeInTheDocument();
  });

  it('sem speechSynthesis, não mostra nada', () => {
    const tts = createBrowserTts(undefined, undefined);
    render(
      <MemoryRouter>
        <TtsContext value={tts}>
          <ScreenProvider>
            <VoiceDock />
          </ScreenProvider>
        </TtsContext>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('group', { name: voice.dockLabel })).not.toBeInTheDocument();
  });
});

describe('VoiceAutoSpeak com dois VoiceDock montados (topo + comemoração)', () => {
  it('fala uma vez só ao trocar de tela', () => {
    voiceSettings.setVoiceMode(true);
    const fake = createFakeSynth();
    const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);

    render(
      <MemoryRouter>
        <TtsContext value={tts}>
          <ScreenProvider>
            <VoiceAutoSpeak />
            <VoiceDock />
            <VoiceDock compact />
            <Screen speech="Parabéns" />
          </ScreenProvider>
        </TtsContext>
      </MemoryRouter>,
    );

    expect(fake.texts()).toEqual(['Parabéns']);
  });
});
