import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERVAL_MS, useQrReader } from './useQrReader';

function readyVideo() {
  const video = document.createElement('video');
  Object.defineProperty(video, 'readyState', { value: 4 });
  Object.defineProperty(video, 'videoWidth', { value: 640 });
  return { current: video };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useQrReader', () => {
  it('tenta a cada intervalo e entrega o primeiro QR lido, uma vez só', async () => {
    const decode = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('quadro ruim'))
      .mockResolvedValue('https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo');
    const onText = vi.fn();

    renderHook(() => useQrReader(readyVideo(), true, onText, async () => decode));

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 5);
    expect(decode).toHaveBeenCalledTimes(3);
    expect(onText).toHaveBeenCalledExactlyOnceWith(
      'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo',
    );
  });

  it('inativo não lê nada; desmontar para o laço', async () => {
    const decode = vi.fn().mockResolvedValue(null);
    const video = readyVideo();

    const { rerender, unmount } = renderHook(
      ({ active }) => useQrReader(video, active, vi.fn(), async () => decode),
      { initialProps: { active: false } },
    );
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    expect(decode).not.toHaveBeenCalled();

    rerender({ active: true });
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    const calls = decode.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    unmount();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 4);
    expect(decode).toHaveBeenCalledTimes(calls);
  });

  it('vídeo ainda sem imagem: espera, sem chamar o decodificador', async () => {
    const decode = vi.fn();
    const video = { current: document.createElement('video') };

    renderHook(() => useQrReader(video, true, vi.fn(), async () => decode));
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(decode).not.toHaveBeenCalled();
  });
});
