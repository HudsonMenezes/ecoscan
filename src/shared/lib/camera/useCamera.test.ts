import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldMirror, useCamera } from './useCamera';

function fakeStream(facingMode?: string) {
  const track = { stop: vi.fn(), getSettings: () => ({ facingMode }) };
  return {
    stream: {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream,
    track,
  };
}

function stubGetUserMedia(impl: () => Promise<MediaStream>) {
  const getUserMedia = vi.fn(impl);
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });
  return getUserMedia;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('shouldMirror', () => {
  it.each([
    ['user', false, true],
    ['environment', true, false],
    [undefined, true, true],
    [undefined, false, false],
  ])('facingMode=%s, pointer fine=%s → %s', (facingMode, fine, expected) => {
    expect(shouldMirror(facingMode, fine)).toBe(expected);
  });
});

describe('useCamera', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('começa parado e não pede a câmera sozinho', () => {
    const getUserMedia = stubGetUserMedia(async () => fakeStream().stream);

    const { result } = renderHook(() => useCamera());

    expect(result.current.state).toEqual({ status: 'idle' });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('pede a câmera traseira e fica pronta', async () => {
    const { stream } = fakeStream('environment');
    const getUserMedia = stubGetUserMedia(async () => stream);
    const { result } = renderHook(() => useCamera());

    await act(() => result.current.start());

    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: false,
        video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
      }),
    );
    expect(result.current.state).toEqual({ status: 'ready', stream, mirrored: false });
  });

  it('câmera frontal fica com preview espelhado', async () => {
    stubGetUserMedia(async () => fakeStream('user').stream);
    const { result } = renderHook(() => useCamera());

    await act(() => result.current.start());

    expect(result.current.state).toMatchObject({ status: 'ready', mirrored: true });
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'unavailable'],
    ['NotReadableError', 'unavailable'],
    ['OverconstrainedError', 'unavailable'],
  ])('erro %s → %s', async (name, status) => {
    stubGetUserMedia(async () => {
      throw new DOMException('falhou', name);
    });
    const { result } = renderHook(() => useCamera());

    await act(() => result.current.start());

    expect(result.current.state).toEqual({ status });
  });

  it('navegador sem getUserMedia → unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined });
    const { result } = renderHook(() => useCamera());

    await act(() => result.current.start());

    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('stop desliga a câmera e volta ao início', async () => {
    const { stream, track } = fakeStream('environment');
    stubGetUserMedia(async () => stream);
    const { result } = renderHook(() => useCamera());
    await act(() => result.current.start());

    act(() => result.current.stop());

    expect(track.stop).toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('sair da tela desliga a câmera', async () => {
    const { stream, track } = fakeStream('environment');
    stubGetUserMedia(async () => stream);
    const { result, unmount } = renderHook(() => useCamera());
    await act(() => result.current.start());

    unmount();

    expect(track.stop).toHaveBeenCalled();
  });

  it('permissão que chega depois de sair da tela não deixa a câmera ligada', async () => {
    const pending = deferred<MediaStream>();
    stubGetUserMedia(() => pending.promise);
    const { result, unmount } = renderHook(() => useCamera());
    let starting!: Promise<void>;
    act(() => {
      starting = result.current.start();
    });

    unmount();
    const { stream, track } = fakeStream('environment');
    pending.resolve(stream);
    await starting;

    expect(track.stop).toHaveBeenCalled();
  });

  it('capture falha com mensagem clara se o vídeo não estiver pronto', async () => {
    const { result } = renderHook(() => useCamera());

    await expect(result.current.capture()).rejects.toThrow('A câmera ainda não está pronta');
  });
});
