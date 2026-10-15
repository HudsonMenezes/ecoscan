import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { strings } from '@/config/strings';
import { createRoutes } from './router';

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('router', () => {
  it.each([
    [strings.nav.scan, strings.scan.title, '/escanear'],
    [strings.nav.discard, strings.discard.title, '/descartar'],
    [strings.nav.wallet, strings.wallet.title, '/carteira'],
  ])('o item "%s" da barra inferior abre a tela "%s"', async (item, title, path) => {
    const router = renderAt('/');
    const nav = await screen.findByRole('navigation', { name: strings.nav.label });

    await userEvent.click(within(nav).getByRole('link', { name: item }));

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
  });

  it('a barra inferior marca a tela atual', async () => {
    renderAt('/carteira');
    const nav = await screen.findByRole('navigation', { name: strings.nav.label });

    expect(within(nav).getByRole('link', { name: strings.nav.wallet })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: strings.nav.home })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('o link de início volta para a Home', async () => {
    renderAt('/carteira');

    await userEvent.click(
      await screen.findByRole('link', { name: strings.appName + strings.layout.homeHint }),
    );

    expect(screen.getByRole('heading', { name: strings.home.title })).toBeInTheDocument();
  });

  it('rota desconhecida redireciona para a Home', async () => {
    const router = renderAt('/nao-existe');

    expect(await screen.findByRole('heading', { name: strings.home.title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});
