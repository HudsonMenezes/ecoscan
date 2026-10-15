import OpenAI from 'openai';

type Env = Record<string, string | undefined>;

export const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts';
export const TTS_VOICE = 'coral';
export const TTS_INSTRUCTIONS =
  'Fale em português do Brasil, devagar, com tom amigável e acolhedor, para crianças e adultos.';

// O que o handler precisa da OpenAI: texto → áudio MP3 (stream). Injetável nos testes.
export type TtsModel = (text: string, signal: AbortSignal) => Promise<ReadableStream<Uint8Array>>;

export class EmptyAudioError extends Error {}

let client: OpenAI | null = null;

export function createOpenAITtsModel(env: Env = process.env): TtsModel {
  return async (text, signal) => {
    // Retentativas e timeout ficam no handler.
    client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0 });
    const response = await client.audio.speech.create(
      {
        model: env.OPENAI_TTS_MODEL || DEFAULT_TTS_MODEL,
        voice: TTS_VOICE,
        input: text,
        instructions: TTS_INSTRUCTIONS,
        response_format: 'mp3',
      },
      { signal },
    );
    if (!response.body) throw new EmptyAudioError('resposta sem áudio');
    return response.body;
  };
}
