import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import type * as camera from '@/shared/lib/camera';
import { resizeImageFile } from '@/shared/lib/camera';
import { mockPointer, mockVideoInputs } from '@/test/mockDevice';
import { CameraView } from './CameraView';

vi.mock('@/shared/lib/camera', async (importOriginal) => ({
  ...(await importOriginal<typeof camera>()),
  resizeImageFile: vi.fn(),
}));

function stubCamera(result: { facingMode?: string } | { error: string }) {
  const getUserMedia = vi.fn(async () => {
    if ('error' in result) throw new DOMException('falhou', result.error);
    const track = { stop: vi.fn(), getSettings: () => ({ facingMode: result.facingMode }) };
    return { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
  });
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });
  return getUserMedia;
}

function uploadInput() {
  return screen.getByLabelText(strings.camera.upload);
}

describe('CameraView', () => {
  beforeEach(() => {
    // O jsdom não toca vídeo.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('só pede a câmera depois do toque em "Abrir câmera"', async () => {
    const getUserMedia = stubCamera({ facingMode: 'environment' });
    render(<CameraView onCapture={vi.fn()} />);

    expect(getUserMedia).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: strings.camera.open }));

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(await screen.findByRole('button', { name: strings.camera.capture })).toBeEnabled();
  });

  it('câmera traseira: preview sem espelho', async () => {
    stubCamera({ facingMode: 'environment' });
    const { container } = render(<CameraView onCapture={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: strings.camera.open }));
    await screen.findByRole('button', { name: strings.camera.capture });

    expect(container.querySelector('video')).not.toHaveClass('camera__video--mirrored');
  });

  it('câmera frontal: preview espelhado', async () => {
    stubCamera({ facingMode: 'user' });
    const { container } = render(<CameraView onCapture={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: strings.camera.open }));
    await screen.findByRole('button', { name: strings.camera.capture });

    expect(container.querySelector('video')).toHaveClass('camera__video--mirrored');
  });

  it.each([
    ['NotAllowedError', strings.camera.denied],
    ['NotFoundError', strings.camera.unavailable],
  ])('câmera com %s mostra o aviso e o "Enviar foto"', async (error, message) => {
    stubCamera({ error });
    render(<CameraView onCapture={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: strings.camera.open }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: strings.camera.capture })).toBeNull();
    const input = uploadInput();
    expect(input).toHaveAttribute('accept', 'image/*');
    // Sem capture: o celular oferece câmera e galeria.
    expect(input).not.toHaveAttribute('capture');
  });

  it('a foto enviada passa pelo redimensionamento antes de chegar ao onCapture', async () => {
    const resized = new Blob(['jpeg'], { type: 'image/jpeg' });
    vi.mocked(resizeImageFile).mockResolvedValue(resized);
    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);
    const original = new File(['raw'], 'foto.heic', { type: 'image/heic' });

    await userEvent.upload(uploadInput(), original);

    expect(resizeImageFile).toHaveBeenCalledWith(original);
    expect(onCapture).toHaveBeenCalledWith(resized);
  });

  it('imagem que não abre mostra erro e não chama o onCapture', async () => {
    vi.mocked(resizeImageFile).mockRejectedValue(new Error('decode'));
    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    await userEvent.upload(uploadInput(), new File(['x'], 'x.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(strings.camera.invalidImage);
    expect(onCapture).not.toHaveBeenCalled();
  });
});

describe('CameraView no computador', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('com webcam: câmera e área de arrastar e soltar lado a lado', async () => {
    mockPointer('desktop');
    mockVideoInputs(1);
    const { container } = render(<CameraView onCapture={vi.fn()} />);

    expect(await screen.findByText(strings.camera.dropHint)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: strings.camera.open })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('camera--side-by-side');
  });

  it('sem webcam: mostra só o envio de arquivo, sem oferecer a câmera', async () => {
    mockPointer('desktop');
    const enumerateDevices = mockVideoInputs(0);
    const { container } = render(<CameraView onCapture={vi.fn()} />);

    await vi.waitFor(() => expect(enumerateDevices).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.firstChild).toHaveClass('camera--upload-only'));
    expect(screen.queryByRole('button', { name: strings.camera.open })).toBeNull();
    expect(screen.getByText(strings.camera.dropHint)).toBeInTheDocument();
  });

  it('soltar uma imagem passa pelo redimensionamento', async () => {
    mockPointer('desktop');
    mockVideoInputs(0);
    const resized = new Blob(['jpeg'], { type: 'image/jpeg' });
    vi.mocked(resizeImageFile).mockResolvedValue(resized);
    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);
    const file = new File(['raw'], 'foto.png', { type: 'image/png' });

    fireEvent.drop(screen.getByText(strings.camera.dropHint).closest('label')!, {
      dataTransfer: { files: [file] },
    });

    await vi.waitFor(() => expect(onCapture).toHaveBeenCalledWith(resized));
    expect(resizeImageFile).toHaveBeenCalledWith(file);
  });

  it('soltar algo que não é imagem mostra erro sem processar', async () => {
    mockPointer('desktop');
    mockVideoInputs(0);
    vi.mocked(resizeImageFile).mockClear();
    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    fireEvent.drop(screen.getByText(strings.camera.dropHint).closest('label')!, {
      dataTransfer: { files: [new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(strings.camera.invalidImage);
    expect(resizeImageFile).not.toHaveBeenCalled();
    expect(onCapture).not.toHaveBeenCalled();
  });

  it('no celular nada muda: botão de envio e sem área de arrastar', () => {
    mockPointer('touch');
    mockVideoInputs(0);
    render(<CameraView onCapture={vi.fn()} />);

    expect(screen.getByRole('button', { name: strings.camera.open })).toBeInTheDocument();
    expect(screen.queryByText(strings.camera.dropHint)).toBeNull();
  });
});
