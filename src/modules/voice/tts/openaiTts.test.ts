import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOpenAITts } from './openaiTts';

// AudioContext falso: guarda as fontes tocadas e deixa o teste terminar o áudio.
function fakeAudio() {
  const sources: { started: boolean; stopped: boolean; onended: (() => void) | null }[] = [];
  const context = {
    destination: {} as AudioDestinationNode,
    resume: vi.fn(async () => {}),
    decodeAudioData: vi.fn(async (bytes: ArrayBuffer) => ({ bytes }) as unknown as AudioBuffer),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null as AudioBuffer | null,
        started: false,
        stopped: false,
        onended: null as (() => void) | null,
        connect: vi.fn(),
        start() {
          source.started = true;
        },
        stop() {
          source.stopped = true;
          source.onended?.();
        },
      };
      sources.push(source);
      return source as unknown as AudioBufferSourceNode;
    }),
  };
  return { context, sources, createContext: vi.fn(() => context) };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(
  fetchAudio: (text: string) => Promise<ArrayBuffer> = vi.fn(async () => new ArrayBuffer(8)),
) {
  const audio = fakeAudio();
  const tts = createOpenAITts({ fetchAudio, createContext: audio.createContext });
  return { tts, fetchAudio, ...audio };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createOpenAITts', () => {
  it('busca o áudio, toca e resolve quando termina', async () => {
    const { tts, fetchAudio, sources } = setup();

    const done = tts.speak('Isso é uma pilha.');
    expect(tts.isSpeaking()).toBe(true); // já "falando" enquanto carrega
    await flush();

    expect(fetchAudio).toHaveBeenCalledWith('Isso é uma pilha.');
    expect(sources[0]?.started).toBe(true);
    sources[0]?.onended?.();
    await expect(done).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
  });

  it('libera o áudio (resume) dentro do toque, antes de esperar a rede', () => {
    const { tts, context } = setup(vi.fn(() => new Promise<ArrayBuffer>(() => {})));
    void tts.speak('Olá');
    expect(context.resume).toHaveBeenCalledOnce();
  });

  it('"repetir" o mesmo texto não chama a API de novo', async () => {
    const { tts, fetchAudio, sources } = setup();

    void tts.speak('Olá');
    await flush();
    sources[0]?.onended?.();
    void tts.speak('Olá');
    await flush();

    expect(fetchAudio).toHaveBeenCalledOnce();
    expect(sources).toHaveLength(2);
    expect(tts.cacheSize()).toBe(1);
  });

  it('textos diferentes geram chamadas diferentes', async () => {
    const { tts, fetchAudio } = setup();
    void tts.speak('um');
    void tts.speak('dois');
    await flush();
    expect(vi.mocked(fetchAudio).mock.calls.map(([text]) => text)).toEqual(['um', 'dois']);
  });

  it('parar enquanto carrega: não toca quando o áudio chega', async () => {
    const { tts, sources } = setup();

    const done = tts.speak('Olá');
    tts.stop();
    await flush();

    await expect(done).resolves.toBeUndefined();
    expect(sources).toHaveLength(0);
    expect(tts.isSpeaking()).toBe(false);
  });

  it('parar enquanto toca: para a fonte e resolve', async () => {
    const { tts, sources } = setup();
    const done = tts.speak('Olá');
    await flush();

    tts.stop();

    expect(sources[0]?.stopped).toBe(true);
    await expect(done).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
  });

  it('uma fala nova interrompe a anterior', async () => {
    const { tts, sources } = setup();
    const first = tts.speak('primeira');
    await flush();

    void tts.speak('segunda');
    await flush();

    await expect(first).resolves.toBeUndefined();
    expect(sources[0]?.stopped).toBe(true);
    expect(sources[1]?.started).toBe(true);
    expect(tts.isSpeaking()).toBe(true);
  });

  it('falha da API: resolve sem quebrar e não guarda no cache', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchAudio = vi.fn(async () => {
      throw new Error('tts 502');
    });
    const { tts } = setup(fetchAudio);

    await expect(tts.speak('Olá')).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
    expect(tts.cacheSize()).toBe(0);

    await tts.speak('Olá');
    expect(fetchAudio).toHaveBeenCalledTimes(2);
  });

  it('texto vazio não chama a API', async () => {
    const { tts, fetchAudio } = setup();
    await tts.speak('  ');
    expect(fetchAudio).not.toHaveBeenCalled();
  });
});
