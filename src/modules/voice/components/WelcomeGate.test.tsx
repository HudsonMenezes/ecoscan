import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useScreen } from '@/shared/lib/screen';
import { FakeUtteranceCtor, createFakeSynth } from '@/test/fakeSpeech';
import { voiceSettings } from '../model/voiceSettings';
import { WELCOME_KEY, markWelcomeSeen } from '../model/welcome';
import { createBrowserTts } from '../tts/browserTts';
import { TtsContext } from '../tts/useSpeech';
import { WelcomeGate } from './WelcomeGate';

const { welcome } = strings;

function Home() {
  useScreen({ speech: 'Tela inicial.' });
  return null;
}

function setup() {
  const fake = createFakeSynth();
  const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);
  const view = render(
    <TtsContext value={tts}>
      <ScreenProvider>
        <WelcomeGate />
        <Home />
      </ScreenProvider>
    </TtsContext>,
  );
  return { fake, view };
}

const startButton = () => screen.queryByRole('button', { name: welcome.start });

beforeEach(() => {
  localStorage.clear();
});

describe('WelcomeGate', () => {
  it('primeira visita: um botão grande, com foco, e o aviso de privacidade', () => {
    setup();

    expect(screen.getByRole('dialog', { name: welcome.title })).toBeInTheDocument();
    expect(startButton()).toHaveFocus();
    expect(screen.getByText(strings.privacy.voice)).toBeInTheDocument();
  });

  it('"Começar" fala a apresentação e a tela, liga o Modo voz e não aparece mais', async () => {
    const { fake, view } = setup();
    expect(voiceSettings.getVoiceMode()).toBe(false);

    await userEvent.click(startButton()!);

    expect(fake.texts()).toEqual([`${welcome.speech} Tela inicial.`]);
    expect(voiceSettings.getVoiceMode()).toBe(true);
    expect(startButton()).not.toBeInTheDocument();
    expect(localStorage.getItem(WELCOME_KEY)).toBe('{"seen":true}');

    view.unmount();
    setup();
    expect(startButton()).not.toBeInTheDocument();
  });

  it('quem já passou pela boas-vindas não vê de novo, e o Modo voz não muda', () => {
    markWelcomeSeen();
    const { fake } = setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(voiceSettings.getVoiceMode()).toBe(false);
    expect(fake.spoken).toEqual([]);
  });
});
