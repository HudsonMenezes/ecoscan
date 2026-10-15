import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useScreen, type ScreenAction } from '@/shared/lib/screen';
import { FakeUtteranceCtor, createFakeSynth } from '@/test/fakeSpeech';
import { createFakeRecognition } from '@/test/fakeRecognition';
import { createBrowserTts } from '../tts/browserTts';
import { TtsContext } from '../tts/useSpeech';
import { RecognitionContext } from '../stt/useVoiceCommand';
import { VoiceDock } from './VoiceDock';

const { voice } = strings;

function Where() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function Screen({ speech, actions }: { speech: string; actions?: ScreenAction[] }) {
  useScreen({ speech, actions });
  return <Where />;
}

function setup({
  speech = 'Bem-vindo ao EcoScan.',
  actions,
  recognition = createFakeRecognition(),
}: {
  speech?: string;
  actions?: ScreenAction[];
  recognition?: ReturnType<typeof createFakeRecognition> | null;
} = {}) {
  const fake = createFakeSynth();
  const tts = createBrowserTts(fake.synth, FakeUtteranceCtor);
  const router = createMemoryRouter([
    {
      path: '*',
      element: (
        <TtsContext value={tts}>
          <RecognitionContext value={recognition ? recognition.Ctor : null}>
            <ScreenProvider>
              <VoiceDock />
              <Screen speech={speech} actions={actions} />
            </ScreenProvider>
          </RecognitionContext>
        </TtsContext>
      ),
    },
  ]);
  render(<RouterProvider router={router} />);
  return { fake, recognition: recognition! };
}

const micButton = () => screen.getByRole('button', { name: voice.command });
const path = () => screen.getByTestId('path').textContent;

async function say(recognition: ReturnType<typeof createFakeRecognition>, ...heard: string[]) {
  await userEvent.click(micButton());
  act(() => recognition.say(...heard));
}

beforeEach(() => {
  localStorage.clear();
});

describe('VoiceDock: comandos de voz (🎤)', () => {
  it('sem reconhecimento de voz (Firefox), o 🎤 não aparece e nada quebra', () => {
    const error = vi.spyOn(console, 'error');
    setup({ recognition: null });

    expect(screen.queryByRole('button', { name: voice.command })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: voice.listen })).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
  });

  it('"escanear" na home leva a /escanear', async () => {
    const { recognition } = setup();
    await say(recognition, 'Escanear');
    expect(path()).toBe('/escanear');
  });

  it.each([
    ['minhas moedas', '/carteira'],
    ['jogar fora', '/descartar'],
    ['voltar', '/'],
  ])('"%s" → %s', async (phrase, expected) => {
    const { recognition } = setup();
    await say(recognition, phrase);
    expect(path()).toBe(expected);
  });

  it('"capturar" na tela do scanner dispara a captura', async () => {
    const capture = vi.fn();
    const { recognition } = setup({
      speech: 'Aponte a câmera.',
      actions: [{ id: 'capture', label: 'Capturar', run: capture }],
    });

    await say(recognition, 'capturar');

    expect(capture).toHaveBeenCalledOnce();
  });

  it('usa a alternativa que é um comando quando a primeira não é', async () => {
    const { recognition } = setup();
    await say(recognition, 'escalar', 'escanear');
    expect(path()).toBe('/escanear');
  });

  it('"repetir" relê a fala da tela', async () => {
    const { recognition, fake } = setup({ speech: 'É uma pilha.' });
    await say(recognition, 'repetir');
    expect(fake.texts()).toEqual(['É uma pilha.']);
  });

  it('"ajuda" fala os comandos desta tela', async () => {
    const { recognition, fake } = setup({
      actions: [{ id: 'capture', label: 'Capturar', run: vi.fn() }],
    });
    await say(recognition, 'ajuda');
    expect(fake.texts()).toEqual([
      'Você pode dizer: capturar, escanear, descartar, minha carteira, início ou repetir.',
    ]);
  });

  it('frase desconhecida → "Não entendi" + sugestões, sem navegar', async () => {
    const { recognition, fake } = setup();
    await say(recognition, 'banana');
    expect(path()).toBe('/');
    expect(fake.texts()[0]).toMatch(/^Não entendi\. Você pode dizer: escanear, /);
  });

  it.each([
    ['not-allowed', voice.micDenied],
    ['no-speech', voice.noSpeech],
    ['network', voice.micError],
  ])('erro %s → fala o aviso', async (error, message) => {
    const { recognition, fake } = setup();
    await userEvent.click(micButton());
    act(() => recognition.fail(error));
    expect(fake.texts()).toEqual([message]);
  });

  it('mostra que está ouvindo, e um segundo toque cancela', async () => {
    const { recognition } = setup();
    await userEvent.click(micButton());

    const listening = screen.getByRole('button', { name: voice.listening });
    expect(listening).toHaveClass('voice-dock__mic--active');

    await userEvent.click(listening);
    expect(recognition.last().aborted).toBe(true);
    expect(micButton()).toBeInTheDocument();
  });

  it('para a fala do app antes de escutar (o microfone não ouve o próprio app)', async () => {
    const { recognition } = setup();
    await userEvent.click(screen.getByRole('button', { name: voice.listen }));
    expect(screen.getByRole('button', { name: voice.stop })).toBeInTheDocument();

    await userEvent.click(micButton());

    expect(screen.getByRole('button', { name: voice.listen })).toBeInTheDocument();
    expect(recognition.last().started).toBe(true);
  });

  it('o microfone só liga depois do toque', () => {
    const { recognition } = setup();
    expect(recognition.instances).toHaveLength(0);
  });
});
