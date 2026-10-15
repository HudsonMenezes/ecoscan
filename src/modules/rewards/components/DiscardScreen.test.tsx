import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import { LAST_SCAN_KEY } from '@/modules/scanner/model/lastScan';
import { ScreenProvider, useCurrentScreen, type CurrentScreen } from '@/shared/lib/screen';
import { LEDGER_KEY, getLedger } from '../model/ledger';
import { playChime } from './chime';
import { DiscardScreen } from './DiscardScreen';

vi.mock('./chime', () => ({ playChime: vi.fn() }));

let current: CurrentScreen = { speech: '', actions: [] };
function Spy() {
  const screenNow = useCurrentScreen();
  useEffect(() => {
    current = screenNow;
  });
  return null;
}

function renderAt(url: string) {
  const router = createMemoryRouter(
    [
      { path: '/descartar', element: <DiscardScreen /> },
      { path: '/escanear', element: <h1>Tela escanear</h1> },
      { path: '/carteira', element: <h1>Tela carteira</h1> },
    ],
    { initialEntries: [url] },
  );
  render(
    <ScreenProvider>
      <RouterProvider router={router} />
      <Spy />
    </ScreenProvider>,
  );
  return router;
}

function seedScan(minutesAgo = 1, category = 'plastico') {
  const scannedAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const lastScan = { id: crypto.randomUUID(), category, itemName: 'Garrafa PET', scannedAt };
  localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(lastScan));
  return lastScan;
}

const { disposal } = strings;

beforeEach(() => {
  localStorage.clear();
  vi.mocked(playChime).mockClear();
});

describe('DiscardScreen', () => {
  it('sucesso: comemora com +XP/+moedas, toca o som, fala e grava no ledger', async () => {
    seedScan();
    renderAt('/descartar?ponto=escola-demo');

    expect(await screen.findByRole('heading', { name: disposal.success.title })).toHaveFocus();
    expect(screen.getByText('+10 XP e +5 moedas')).toBeInTheDocument();
    expect(screen.getByText('Você descartou garrafa PET corretamente.')).toBeInTheDocument();
    expect(playChime).toHaveBeenCalled();
    expect(current.speech).toBe(
      'Parabéns! Você descartou garrafa PET corretamente e ganhou 10 pontos e 5 moedas.',
    );
    expect(current.actions.map((a) => a.label)).toEqual([disposal.scanAnother, disposal.wallet]);
    expect(getLedger()).toHaveLength(1);
  });

  it('sobe de nível: mostra e fala o nível novo', async () => {
    const old = seedScan(30);
    localStorage.setItem(
      LEDGER_KEY,
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          type: 'earn',
          scanId: old.id,
          pointId: 'escola-demo',
          category: 'plastico',
          itemName: 'Lata',
          xp: 45,
          coins: 20,
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    seedScan(); // novo scan: 45 + 10 = 55 XP → Broto
    renderAt('/descartar?ponto=escola-demo');

    expect(await screen.findByText(disposal.success.levelUp('Broto'))).toBeInTheDocument();
    expect(current.speech).toContain(disposal.success.levelUp('Broto'));
  });

  it('"Escanear outro" e "Minha carteira" navegam', async () => {
    seedScan();
    const router = renderAt('/descartar?ponto=escola-demo');

    await userEvent.click(await screen.findByRole('link', { name: disposal.wallet }));
    expect(router.state.location.pathname).toBe('/carteira');

    await router.navigate('/descartar?ponto=escola-demo'); // já contado
    await userEvent.click(await screen.findByRole('button', { name: disposal.scanNext }));
    expect(router.state.location.pathname).toBe('/escanear');
  });

  it.each([
    [
      'ponto desconhecido',
      '/descartar?ponto=outro',
      null,
      disposal.errors.unknown_point,
      disposal.readAnotherQr,
      '/descartar',
    ],
    [
      'sem scan',
      '/descartar?ponto=escola-demo',
      null,
      disposal.errors.no_scan,
      disposal.scanItem,
      '/escanear',
    ],
    [
      'scan com mais de 10 min',
      '/descartar?ponto=escola-demo',
      11,
      disposal.errors.scan_expired,
      disposal.scanItem,
      '/escanear',
    ],
  ] as const)('%s → mensagem e uma ação', async (_, url, minutesAgo, message, action, target) => {
    if (minutesAgo !== null) seedScan(minutesAgo);
    const router = renderAt(url);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(current).toMatchObject({ speech: message, actions: [{ label: action }] });
    expect(playChime).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: action }));
    expect(router.state.location.pathname).toBe(target);
    expect(getLedger()).toEqual([]);
  });

  it('o mesmo scan não conta duas vezes; um scan novo do mesmo material conta', async () => {
    seedScan();
    const router = renderAt('/descartar?ponto=escola-demo');
    await screen.findByRole('heading', { name: disposal.success.title });

    await router.navigate('/escanear');
    await router.navigate('/descartar?ponto=escola-demo');
    expect(await screen.findByRole('alert')).toHaveTextContent(disposal.errors.already_claimed);

    seedScan(); // outra garrafa PET
    await router.navigate('/escanear');
    await router.navigate('/descartar?ponto=escola-demo');
    expect(
      await screen.findByRole('heading', { name: disposal.success.title }),
    ).toBeInTheDocument();
    expect(getLedger()).toHaveLength(2);
  });

  it('sem ?ponto → instrução para ler o QR', async () => {
    renderAt('/descartar');

    expect(await screen.findByText(disposal.readerHint)).toBeInTheDocument();
    expect(current.speech).toBe(strings.discard.speech);
  });
});

describe('describeDiscardScreen', () => {
  it('categoria não aceita cita a categoria do último scan', async () => {
    const { describeDiscardScreen } = await import('./describeDiscardScreen');
    const nav = { scan: vi.fn(), readQr: vi.fn(), wallet: vi.fn() };
    const lastScan = {
      id: crypto.randomUUID(),
      category: 'vidro' as const,
      itemName: 'Pote',
      scannedAt: new Date().toISOString(),
    };

    const described = describeDiscardScreen(
      { status: 'error', reason: 'category_not_accepted', lastScan },
      nav,
    );

    expect(described.speech).toBe('Esse ponto não recebe vidro.');
    described.actions[0]!.run();
    expect(nav.scan).toHaveBeenCalled();
  });
});
