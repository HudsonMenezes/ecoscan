// Reserva de voz: o áudio vem do POST /api/tts (OpenAI) e toca pelo Web Audio.
// Por que Web Audio e não <audio>: o iOS só toca som dentro do toque do usuário,
// e o áudio chega depois da rede. O AudioContext é liberado (resume) dentro do
// toque e continua liberado. A CSP não permite `data:` em mídia, então não dá
// para destravar um <audio> com um MP3 silencioso embutido.
import type { Tts } from './browserTts';

type AudioContextLike = Pick<
  AudioContext,
  'resume' | 'decodeAudioData' | 'createBufferSource' | 'destination'
>;

export type OpenAITtsDeps = {
  fetchAudio?: (text: string) => Promise<ArrayBuffer>;
  createContext?: () => AudioContextLike;
};

export async function fetchTtsAudio(text: string): Promise<ArrayBuffer> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error(`tts ${response.status}`);
  return response.arrayBuffer();
}

export function createOpenAITts({
  fetchAudio = fetchTtsAudio,
  createContext = () => new AudioContext(),
}: OpenAITtsDeps = {}): Tts & { cacheSize(): number } {
  const listeners = new Set<() => void>();
  // Áudios já gerados nesta sessão (chave = o próprio texto): "repetir" não chama a API de novo.
  const cache = new Map<string, Promise<AudioBuffer>>();
  let context: AudioContextLike | null = null;
  // A fala atual: o `end` dela encerra a promessa do speak; trocar ou parar a invalida.
  let current: { end: () => void; source?: AudioBufferSourceNode } | null = null;

  const notify = () => listeners.forEach((listener) => listener());

  function stop() {
    const playing = current;
    if (!playing) return;
    current = null;
    try {
      playing.source?.stop();
    } catch {
      // Já parou.
    }
    playing.end();
    notify();
  }

  function load(text: string, audio: AudioContextLike) {
    let buffer = cache.get(text);
    if (!buffer) {
      buffer = fetchAudio(text).then((bytes) => audio.decodeAudioData(bytes));
      cache.set(text, buffer);
      // Falhou: não guarda, para a próxima tentativa chamar a API de novo.
      buffer.catch(() => cache.delete(text));
    }
    return buffer;
  }

  return {
    supported: true,
    provider: () => 'openai',
    speak(text) {
      stop();
      if (!text.trim()) return Promise.resolve();

      // Antes de qualquer espera: ainda estamos dentro do toque.
      const audio = (context ??= createContext());
      void audio.resume().catch(() => {});

      return new Promise<void>((resolve) => {
        const me: NonNullable<typeof current> = { end: resolve };
        current = me;
        notify(); // "falando" já enquanto carrega: o 🔊 vira ⏹ na hora

        load(text, audio)
          .then((buffer) => {
            if (current !== me) return;
            const source = audio.createBufferSource();
            source.buffer = buffer;
            source.connect(audio.destination);
            source.onended = () => {
              if (current !== me) return;
              current = null;
              notify();
              resolve();
            };
            me.source = source;
            source.start();
          })
          .catch((error: unknown) => {
            console.warn('[voice] a voz de reserva falhou', error);
            if (current === me) stop();
          });
      });
    },
    stop,
    isSpeaking: () => current !== null,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    cacheSize: () => cache.size,
  };
}
