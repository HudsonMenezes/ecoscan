// Reconhecimento de voz do navegador: uma frase por toque, em pt-BR, sem
// escutar em segundo plano e sem guardar áudio (SPEC-voice).
import { createContext, useCallback, useEffect, useRef, useState } from 'react';

// Só o que usamos da Web Speech API (os tipos não vêm no lib.dom do TypeScript).
type RecognitionAlternative = { transcript: string };
type RecognitionEvent = { results: ArrayLike<ArrayLike<RecognitionAlternative>> };
type RecognitionErrorEvent = { error: string };

export type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

export type RecognitionCtor = new () => Recognition;

export type VoiceCommandError = 'not-allowed' | 'no-speech' | 'other';

export function getRecognitionCtor(
  win: Partial<
    Record<'SpeechRecognition' | 'webkitSpeechRecognition', unknown>
  > = globalThis as object,
): RecognitionCtor | null {
  return ((win.SpeechRecognition ?? win.webkitSpeechRecognition) as RecognitionCtor) ?? null;
}

const ALTERNATIVES = 3;

// Depois do stop(), quanto esperar pelo `end` antes de abortar e seguir (o iOS às vezes não avisa).
export const END_TIMEOUT_MS = 1500;

/**
 * `onResult` recebe as alternativas reconhecidas (a mais provável primeiro);
 * `onError`, o motivo resumido de não ter entendido nada.
 */
export function useVoiceCommand({
  onResult,
  onError,
  Ctor = getRecognitionCtor(),
}: {
  onResult: (transcripts: string[]) => void;
  onError: (error: VoiceCommandError) => void;
  Ctor?: RecognitionCtor | null;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const handlers = useRef({ onResult, onError });
  useEffect(() => {
    handlers.current = { onResult, onError };
  });

  const cancel = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    setListening(false);
  }, []);

  const listen = useCallback(() => {
    if (!Ctor) return;
    cancel();
    const recognition = new Ctor();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = ALTERNATIVES;

    // O resultado (ou o erro) só é entregue no fim, com o microfone já fechado: o comando
    // costuma navegar e fazer a nova tela falar, e no iPhone o microfone ficava aberto.
    let outcome = () => handlers.current.onError('no-speech');
    let endTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (recognitionRef.current !== recognition) return;
      clearTimeout(endTimer);
      recognitionRef.current = null;
      setListening(false);
      outcome();
    };
    const waitForEnd = () => {
      clearTimeout(endTimer);
      endTimer = setTimeout(() => {
        if (recognitionRef.current !== recognition) return;
        finish();
        recognition.abort();
      }, END_TIMEOUT_MS);
    };

    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const first = event.results[0];
      const transcripts = first ? Array.from(first, (alt) => alt.transcript) : [];
      if (!transcripts.some((text) => text.trim())) return;
      outcome = () => handlers.current.onResult(transcripts);
      recognition.stop();
      waitForEnd();
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition || event.error === 'aborted') return;
      const error: VoiceCommandError =
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'not-allowed'
          : event.error === 'no-speech'
            ? 'no-speech'
            : 'other';
      outcome = () => handlers.current.onError(error);
      waitForEnd();
    };
    recognition.onend = finish;

    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      handlers.current.onError('other');
    }
  }, [Ctor, cancel]);

  // Sair da tela nunca deixa o microfone aberto.
  useEffect(() => cancel, [cancel]);

  return { supported: Ctor !== null, listening, listen, cancel };
}

// Os testes trocam o reconhecimento de voz por este contexto (undefined = o do navegador).
export const RecognitionContext = createContext<RecognitionCtor | null | undefined>(undefined);
