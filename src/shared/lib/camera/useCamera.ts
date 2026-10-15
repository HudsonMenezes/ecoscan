import { useCallback, useEffect, useRef, useState } from 'react';
import { resizeToJpeg } from './resizeImage';

export type CameraState =
  | { status: 'idle' | 'requesting' }
  // `mirrored`: câmera frontal/webcam. Só o preview é espelhado, nunca a foto.
  | { status: 'ready'; stream: MediaStream; mirrored: boolean }
  | { status: 'denied' | 'unavailable' }; // a UI mostra o fallback de upload

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

// Celulares informam o facingMode; no computador ele costuma vir vazio e a
// câmera é uma webcam voltada para o usuário.
export function shouldMirror(facingMode: string | undefined, isFinePointer: boolean) {
  if (facingMode === 'user') return true;
  if (facingMode === undefined) return isFinePointer;
  return false;
}

function isFinePointer() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

function errorStatus(error: unknown): 'denied' | 'unavailable' {
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable';
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({ status: 'idle' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Invalida pedidos antigos: se o usuário parar ou sair da tela antes da
  // permissão chegar, o stream que chegar depois é fechado na hora.
  const requestIdRef = useRef(0);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    if (streamRef.current) stopStream(streamRef.current);
    streamRef.current = null;
    setState({ status: 'idle' });
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: 'unavailable' });
      return;
    }
    const requestId = ++requestIdRef.current;
    setState({ status: 'requesting' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      if (requestId !== requestIdRef.current) {
        stopStream(stream);
        return;
      }
      if (streamRef.current) stopStream(streamRef.current);
      streamRef.current = stream;
      const facingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
      setState({ status: 'ready', stream, mirrored: shouldMirror(facingMode, isFinePointer()) });
    } catch (error) {
      if (requestId === requestIdRef.current) setState({ status: errorStatus(error) });
    }
  }, []);

  // Liga o stream ao <video> quando ele aparece na tela.
  useEffect(() => {
    const video = videoRef.current;
    if (state.status !== 'ready' || !video) return;
    video.srcObject = state.stream;
    video.play().catch(() => {
      // Autoplay bloqueado: o vídeo continua parado até o próximo toque, sem quebrar.
    });
  }, [state]);

  // Sair da tela sempre desliga a câmera.
  useEffect(
    () => () => {
      requestIdRef.current += 1;
      if (streamRef.current) stopStream(streamRef.current);
    },
    [],
  );

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error('A câmera ainda não está pronta');
    }
    return resizeToJpeg(video, video.videoWidth, video.videoHeight);
  }, []);

  return { state, videoRef, start, stop, capture };
}
