import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useCurrentScreen } from '@/shared/lib/screen';
import { HomeScreen } from './HomeScreen';
import { tipOfTheDay } from './tipOfTheDay';

function SpeechSpy() {
  return <output data-testid="speech">{useCurrentScreen().speech}</output>;
}

const AFTERNOON = new Date('2026-10-15T15:00:00');

function renderHome(now = AFTERNOON) {
  render(
    <MemoryRouter>
      <ScreenProvider>
        <HomeScreen now={now} />
        <SpeechSpy />
      </ScreenProvider>
    </MemoryRouter>,
  );
}

const { home } = strings;

beforeEach(() => {
  localStorage.clear();
});

describe('HomeScreen', () => {
  it('saúda pelo horário e mostra o título', () => {
    renderHome();

    expect(screen.getByText('Boa tarde!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: home.title })).toBeInTheDocument();
  });

  it.each([
    [8, 'Bom dia!'],
    [12, 'Boa tarde!'],
    [18, 'Boa noite!'],
  ])('às %ih: "%s"', (hour, greeting) => {
    expect(home.greeting(hour)).toBe(greeting);
  });

  it('as 3 ações levam às telas certas, cada uma com ícone e dica', () => {
    renderHome();
    const actions = within(screen.getByRole('navigation', { name: home.actionsLabel }));

    for (const [label, hint, href] of [
      [home.actions.scan, home.actions.scanHint, '/escanear'],
      [home.actions.discard, home.actions.discardHint, '/descartar'],
      [home.actions.wallet, home.actions.walletHint, '/carteira'],
    ]) {
      const link = actions.getByRole('link', { name: new RegExp(`^${label}`) });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveTextContent(hint!);
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('o cartão do jogador mostra o nível e as moedas do ledger e leva à carteira', async () => {
    renderHome();

    const card = await screen.findByRole('link', { name: /Semente/ });
    expect(card).toHaveAttribute('href', '/carteira');
    expect(card).toHaveTextContent('Nível 1');
    expect(card).toHaveTextContent('0 XP · faltam 50 XP para o nível Broto');
  });

  it('mostra a dica do dia, a mesma o dia inteiro', () => {
    renderHome();

    expect(screen.getByText(tipOfTheDay(AFTERNOON))).toBeInTheDocument();
    expect(tipOfTheDay(new Date('2026-10-15T23:00:00Z'))).toBe(
      tipOfTheDay(new Date('2026-10-15T01:00:00Z')),
    );
    expect(tipOfTheDay(new Date('2026-10-16T12:00:00Z'))).not.toBe(
      tipOfTheDay(new Date('2026-10-15T12:00:00Z')),
    );
  });

  it('registra a fala da Home para o módulo voice', () => {
    renderHome();

    expect(screen.getByTestId('speech')).toHaveTextContent(home.speech);
  });
});
