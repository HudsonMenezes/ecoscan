import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import { mockPointer } from '@/test/mockDevice';
import { QrReader } from './QrReader';

function stubCamera(result: 'ok' | 'denied', devices = 1) {
  const getUserMedia = vi.fn(async () => {
    if (result === 'denied') throw new DOMException('negado', 'NotAllowedError');
    const track = { stop: vi.fn(), getSettings: () => ({ facingMode: 'environment' }) };
    return { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
  });
  const enumerateDevices = vi.fn(async () =>
    Array.from({ length: devices }, () => ({ kind: 'videoinput' }) as MediaDeviceInfo),
  );
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia, enumerateDevices } });
  return getUserMedia;
}

describe('QrReader', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('liga a câmera sozinho ao abrir, sem esperar o toque', async () => {
    const getUserMedia = stubCamera('ok');
    render(
      <StrictMode>
        <QrReader onPoint={vi.fn()} />
      </StrictMode>,
    );

    expect(await screen.findByLabelText(strings.disposal.readerVideo)).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalled();
  });

  it('câmera negada: mostra o aviso', async () => {
    stubCamera('denied');
    render(<QrReader onPoint={vi.fn()} />);

    expect(await screen.findByText(strings.disposal.cameraFailed)).toBeInTheDocument();
  });

  it('computador sem webcam: não pede a câmera e oferece o botão', async () => {
    mockPointer('desktop');
    const getUserMedia = stubCamera('ok', 0);
    render(<QrReader onPoint={vi.fn()} />);

    expect(
      await screen.findByRole('button', { name: strings.disposal.openReader }),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
