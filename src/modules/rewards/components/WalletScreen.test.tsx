import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { CATEGORIES } from '@/modules/scanner';
import { ScreenProvider, useCurrentScreen, type CurrentScreen } from '@/shared/lib/screen';
import { LEDGER_KEY, type LedgerEntry } from '../model/ledger';
import { WalletScreen } from './WalletScreen';

let current: CurrentScreen = { speech: '', actions: [] };
function Spy() {
  const screenNow = useCurrentScreen();
  useEffect(() => {
    current = screenNow;
  });
  return null;
}

function renderWallet() {
  const router = createMemoryRouter(
    [
      { path: '/carteira', element: <WalletScreen /> },
      { path: '/escanear', element: <h1>Tela escanear</h1> },
    ],
    { initialEntries: ['/carteira'] },
  );
  render(
    <ScreenProvider>
      <RouterProvider router={router} />
      <Spy />
    </ScreenProvider>,
  );
  return router;
}

function entry(overrides: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: crypto.randomUUID(),
    type: 'earn',
    scanId: crypto.randomUUID(),
    pointId: 'escola-demo',
    category: 'plastico',
    itemName: 'Garrafa PET',
    xp: 10,
    coins: 5,
    createdAt: '2026-10-15T12:00:00.000Z',
    ...overrides,
  };
}

const seed = (entries: LedgerEntry[]) => localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
const { wallet: text } = strings;
// Valores de XP e moedas, na ordem em que aparecem nos totais.
const totals = () => screen.getAllByRole('definition').map((dd) => dd.textContent);

beforeEach(() => {
  localStorage.clear();
});

describe('WalletScreen', () => {
  it('mostra nível, barra, XP, moedas e o histórico (mais recente primeiro)', async () => {
    seed([
      entry({ itemName: 'Garrafa PET', createdAt: '2026-10-15T12:00:00.000Z' }),
      entry({
        itemName: 'Pilha AA',
        category: 'pilhas_baterias',
        xp: 20,
        coins: 10,
        createdAt: '2026-10-15T13:00:00.000Z',
      }),
      entry({ itemName: 'Lata', category: 'metal', createdAt: '2026-10-15T14:00:00.000Z' }),
    ]);
    renderWallet();

    // 40 XP: Semente (0–49), 80% do caminho até o Broto.
    expect(await screen.findByRole('heading', { name: 'Semente' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByText(text.toNext(10, 'Broto'))).toBeInTheDocument();
    expect(totals()).toEqual(['40', '20']);

    const items = within(screen.getAllByRole('list').at(-1)!).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('.wallet-history__name')?.textContent)).toEqual([
      'Lata',
      'Pilha AA',
      'Garrafa PET',
    ]);
    expect(within(items[1]!).getByText('+20 XP · +10 moedas')).toBeInTheDocument();
    expect(items[1]!.querySelector('.wallet-history__icon')).toHaveStyle({
      backgroundColor: CATEGORIES.pilhas_baterias.color,
    });
  });

  it('a trilha marca os níveis concluídos, o atual e os próximos', async () => {
    seed([entry({ xp: 160 })]); // Muda (nível 3)
    renderWallet();

    await screen.findByRole('heading', { name: 'Muda' });
    const trail = within(screen.getAllByRole('list')[0]!); // a trilha vem antes do histórico
    const steps = trail.getAllByRole('listitem');
    expect(steps).toHaveLength(6);
    expect(steps.map((li) => li.className.match(/--(\w+)/)?.[1])).toEqual([
      'done',
      'done',
      'current',
      'next',
      'next',
      'next',
    ]);
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(steps[5]).toHaveTextContent('Guardião');
  });

  it('fala o saldo e quanto falta para o próximo nível (frase da spec)', async () => {
    seed([entry({ xp: 160, coins: 1 })]);
    renderWallet();
    await screen.findByRole('heading', { name: 'Muda' });

    expect(current.speech).toBe(
      'Você está no nível Muda, com 160 pontos de experiência e 1 moeda. Faltam 140 pontos para o próximo nível.',
    );
  });

  it('no último nível: barra cheia e mensagem de nível máximo', async () => {
    seed([entry({ xp: 900, coins: 400 })]);
    renderWallet();

    expect(await screen.findByRole('heading', { name: 'Guardião do Planeta' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(text.maxLevel)).toBeInTheDocument();
    expect(current.speech).toContain(text.maxLevelSpeech);
  });

  it('sem descartes (ou ledger corrompido): carteira zerada e convite para escanear', async () => {
    localStorage.setItem(LEDGER_KEY, '{corrompido');
    const router = renderWallet();

    expect(await screen.findByText(text.empty)).toBeInTheDocument();
    expect(totals()).toEqual(['0', '0']);

    await userEvent.click(screen.getByRole('link', { name: text.scan }));
    expect(router.state.location.pathname).toBe('/escanear');
  });
});
