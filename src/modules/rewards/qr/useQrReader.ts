// Enquanto `active`, lê um quadro do vídeo a cada INTERVAL_MS e entrega o primeiro
// texto de QR encontrado. Depois de entregar, para: quem usa decide o que fazer.
import { useEffect, useRef } from 'react';
import { createQrDecoder, type QrDecoder } from './decodeQr';

export const INTERVAL_MS = 250;

export function useQrReader(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onText: (text: string) => void,
  createDecoder: () => Promise<QrDecoder> = createQrDecoder,
) {
  const latestOnText = useRef(onText);
  useEffect(() => {
    latestOnText.current = onText;
  });

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function loop(decode: QrDecoder) {
      if (stopped) return;
      const video = videoRef.current;
      let text: string | null = null;
      if (video && video.readyState >= 2 && video.videoWidth) {
        try {
          text = await decode(video);
        } catch {
          // Quadro ruim (troca de câmera, vídeo pausado): tenta no próximo.
        }
      }
      if (stopped) return;
      if (text) latestOnText.current(text);
      else timer = setTimeout(() => void loop(decode), INTERVAL_MS);
    }

    void createDecoder().then(loop);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, videoRef, createDecoder]);
}
