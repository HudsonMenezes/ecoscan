import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScanResult } from '@/shared/contracts';
import { scanImage, ScanError } from '../api/scanImage';
import { saveLastScan, type LastScan } from '../model/lastScan';

export type ScanState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'loading' }
  // `lastScan` é null quando o resultado é `desconhecido` (não salvo).
  | { status: 'result'; result: ScanResult; lastScan: LastScan | null }
  | { status: 'error'; error: ScanError };

type Deps = {
  scan?: typeof scanImage;
  save?: (result: ScanResult) => LastScan | null;
};

export function useScan({ scan = scanImage, save = saveLastScan }: Deps = {}) {
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  const lastPhotoRef = useRef<Blob | null>(null);

  const cancelPending = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const startCapture = useCallback(() => {
    cancelPending();
    setState({ status: 'capturing' });
  }, [cancelPending]);

  const submit = useCallback(
    async (photo: Blob) => {
      cancelPending();
      const controller = new AbortController();
      controllerRef.current = controller;
      lastPhotoRef.current = photo;
      setState({ status: 'loading' });
      try {
        const result = await scan(photo, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setState({ status: 'result', result, lastScan: save(result) });
      } catch (error) {
        // Cancelado (saiu da tela ou começou outro scan): não mexe no estado.
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          error: error instanceof ScanError ? error : new ScanError('unavailable'),
        });
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [cancelPending, save, scan],
  );

  // "Tentar de novo" após erro reenvia a mesma foto; sem foto, volta para a câmera.
  const retry = useCallback(() => {
    if (lastPhotoRef.current) void submit(lastPhotoRef.current);
    else startCapture();
  }, [startCapture, submit]);

  const reset = useCallback(() => {
    cancelPending();
    lastPhotoRef.current = null;
    setState({ status: 'idle' });
  }, [cancelPending]);

  useEffect(() => cancelPending, [cancelPending]);

  return { state, startCapture, submit, retry, reset };
}
