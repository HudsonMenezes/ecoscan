import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { ScreenProvider, useCurrentScreen } from '@/shared/lib/screen';
import { HomeScreen } from './HomeScreen';

function SpeechSpy() {
  return <output data-testid="speech">{useCurrentScreen().speech}</output>;
}

function renderHome() {
  render(
    <MemoryRouter>
      <ScreenProvider>
        <HomeScreen />
        <SpeechSpy />
      </ScreenProvider>
    </MemoryRouter>,
  );
}

describe('HomeScreen', () => {
  it('mostra os 3 botões com rótulo acessível, destino e cor', () => {
    renderHome();

    const expected = [
      { label: strings.home.actions.scan, href: '/escanear', color: 'green' },
      { label: strings.home.actions.discard, href: '/descartar', color: 'blue' },
      { label: strings.home.actions.wallet, href: '/carteira', color: 'amber' },
    ];

    expect(screen.getAllByRole('link')).toHaveLength(expected.length);
    for (const { label, href, color } of expected) {
      const link = screen.getByRole('link', { name: label });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveClass(`big-action--${color}`);
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('registra a fala da Home para o módulo voice', () => {
    renderHome();

    expect(screen.getByTestId('speech')).toHaveTextContent(strings.home.speech);
  });
});
