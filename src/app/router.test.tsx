import { render, screen } from '@testing-library/react';
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
    [strings.home.actions.scan, strings.scan.title, '/escanear'],
    [strings.home.actions.discard, strings.discard.title, '/descartar'],
    [strings.home.actions.wallet, strings.wallet.title, '/carteira'],
  ])('o botão "%s" abre a tela "%s"', async (button, title, path) => {
    const router = renderAt('/');

    await userEvent.click(screen.getByRole('link', { name: button }));

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
  });

  it('o link de início volta para a Home', async () => {
    renderAt('/carteira');

    await userEvent.click(await screen.findByRole('link', { name: strings.layout.home }));

    expect(screen.getByRole('heading', { name: strings.home.title })).toBeInTheDocument();
  });

  it('rota desconhecida redireciona para a Home', async () => {
    const router = renderAt('/nao-existe');

    expect(await screen.findByRole('heading', { name: strings.home.title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});
