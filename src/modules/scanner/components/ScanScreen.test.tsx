import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import type { ScanResult } from '@/shared/contracts';
import { ScreenProvider, useCurrentScreen, type CurrentScreen } from '@/shared/lib/screen';
import type * as scanApi from '../api/scanImage';
import { scanImage, ScanError } from '../api/scanImage';
import { getLastScan } from '../model/lastScan';
import { ScanScreen } from './ScanScreen';

vi.mock('../api/scanImage', async (importOriginal) => ({
  ...(await importOriginal<typeof scanApi>()),
  scanImage: vi.fn(),
}));

// Câmera falsa: um botão que entrega uma foto, e o controle para o comando de voz.
const fakeCapture = vi.fn();
vi.mock('@/shared/ui/CameraView', async () => {
  const { useImperativeHandle } = await import('react');
  return {
    CameraView: ({
      onCapture,
      controlRef,
    }: {
      onCapture: (photo: Blob) => void;
      controlRef?: React.Ref<{ capture: () => void }>;
    }) => {
      useImperativeHandle(controlRef, () => ({ capture: fakeCapture }));
      return (
        <button type="button" onClick={() => onCapture(new Blob(['jpeg']))}>
          foto falsa
        </button>
      );
    },
  };
});

const battery: ScanResult = {
  identified: true,
  itemName: 'Pilha AA',
  material: 'Metal',
  category: 'pilhas_baterias',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Leve a um ponto de coleta de pilhas.',
  categoryReason: 'Tem metais pesados.',
  consequence: 'Contamina o solo e a água.',
  benefit: 'Reciclando, o material vira um produto novo e o ambiente fica mais limpo.',
  spokenSummary: 'É uma pilha. Leve a um ponto de coleta.',
};

let current: CurrentScreen = { speech: '', actions: [] };
function Spy() {
  const screenNow = useCurrentScreen();
  useEffect(() => {
    current = screenNow;
  });
  return null;
}

function renderScreen() {
  const router = createMemoryRouter(
    [
      {
        path: '/escanear',
        element: (
          <ScreenProvider>
            <ScanScreen />
            <Spy />
          </ScreenProvider>
        ),
      },
      { path: '/descartar', element: <h1>tela de descarte</h1> },
    ],
    { initialEntries: ['/escanear'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const takePhoto = () => userEvent.click(screen.getByRole('button', { name: 'foto falsa' }));

describe('ScanScreen', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.mocked(scanImage).mockReset());

  it('começa na câmera, com a fala da tela e a ação de capturar por voz', () => {
    renderScreen();

    expect(screen.getByRole('button', { name: 'foto falsa' })).toBeInTheDocument();
    expect(current.speech).toBe(strings.scan.speech);
    expect(current.actions.map((a) => a.id)).toEqual(['capture']);
    act(() => current.actions[0]?.run());
    expect(fakeCapture).toHaveBeenCalled();
  });

  it('foto → carregando → resultado, com fala e LastScan salvo', async () => {
    let resolve!: (r: ScanResult) => void;
    vi.mocked(scanImage).mockReturnValue(new Promise((r) => (resolve = r)));
    renderScreen();

    await takePhoto();
    expect(screen.getByRole('status')).toHaveTextContent(strings.scanner.loading);
    await vi.waitFor(() => expect(current.speech).toBe(strings.scanner.loadingSpeech));

    await act(async () => resolve(battery));
    expect(await screen.findByRole('heading', { name: battery.itemName })).toBeInTheDocument();
    await vi.waitFor(() => expect(current.speech).toBe(battery.spokenSummary));
    expect(current.actions.map((a) => a.id)).toEqual(['discard', 'scan-again']);
    expect(getLastScan()?.category).toBe('pilhas_baterias');
  });

  it('item composto: a fala inclui o porquê', async () => {
    vi.mocked(scanImage).mockResolvedValue({ ...battery, isComposite: true });
    renderScreen();

    await takePhoto();

    await screen.findByRole('heading', { name: 'Por que no ponto de coleta de pilhas?' });
    await vi.waitFor(() =>
      expect(current.speech).toBe(`${battery.spokenSummary} ${battery.categoryReason}`),
    );
  });

  it('não identificado: mostra as dicas de foto e não salva LastScan', async () => {
    vi.mocked(scanImage).mockResolvedValue({ ...battery, category: 'desconhecido' });
    renderScreen();

    await takePhoto();

    expect(await screen.findByText(strings.scanner.retryTitle)).toBeInTheDocument();
    await vi.waitFor(() => expect(current.speech).toBe(strings.scanner.retrySpeech));
    expect(getLastScan()).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: strings.scanner.newPhoto }));
    expect(screen.getByRole('button', { name: 'foto falsa' })).toBeInTheDocument();
  });

  it('erro: mensagem amigável e "Tentar de novo" reenvia a mesma foto', async () => {
    vi.mocked(scanImage)
      .mockRejectedValueOnce(new ScanError('network'))
      .mockResolvedValueOnce(battery);
    renderScreen();

    await takePhoto();
    expect(await screen.findByRole('alert')).toHaveTextContent(strings.scanErrors.network);
    await vi.waitFor(() => expect(current.speech).toBe(strings.scanErrors.network));

    await userEvent.click(screen.getByRole('button', { name: strings.scanner.tryAgain }));

    expect(await screen.findByRole('heading', { name: battery.itemName })).toBeInTheDocument();
    expect(scanImage).toHaveBeenCalledTimes(2);
    expect(vi.mocked(scanImage).mock.calls[1]?.[0]).toBe(vi.mocked(scanImage).mock.calls[0]?.[0]);
  });

  it('a ação "discard" por voz leva a /descartar', async () => {
    vi.mocked(scanImage).mockResolvedValue(battery);
    const router = renderScreen();
    await takePhoto();
    await screen.findByRole('heading', { name: battery.itemName });
    await vi.waitFor(() => expect(current.actions.map((a) => a.id)).toContain('discard'));

    await act(async () => current.actions.find((a) => a.id === 'discard')?.run());

    expect(router.state.location.pathname).toBe('/descartar');
  });
});
