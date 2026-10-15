import { act, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenProvider } from './ScreenContext';
import { useCurrentScreen, useScreen, type ScreenAction } from './useScreen';

let current: ReturnType<typeof useCurrentScreen> = { speech: '', actions: [] };

function Spy() {
  const screen = useCurrentScreen();
  useEffect(() => {
    current = screen;
  });
  return null;
}

function Screen({ speech, actions }: { speech: string; actions?: ScreenAction[] }) {
  useScreen({ speech, actions });
  return <p>{speech}</p>;
}

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <ScreenProvider>
      {ui}
      <Spy />
    </ScreenProvider>,
  );
}

describe('useScreen', () => {
  it('começa vazio quando nenhuma tela registrou nada', () => {
    renderWithProvider(null);

    expect(current).toEqual({ speech: '', actions: [] });
  });

  it('registra a fala e as ações da tela montada', () => {
    const run = vi.fn();
    renderWithProvider(
      <Screen speech="Tela A" actions={[{ id: 'capture', label: 'Capturar', run }]} />,
    );

    expect(current.speech).toBe('Tela A');
    expect(current.actions.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'capture', label: 'Capturar' },
    ]);
    current.actions[0]?.run();
    expect(run).toHaveBeenCalledOnce();
  });

  it('trocar de tela troca a fala e as ações', () => {
    const { rerender } = renderWithProvider(
      <Screen key="a" speech="Tela A" actions={[{ id: 'retry', label: 'Tentar', run: vi.fn() }]} />,
    );

    rerender(
      <ScreenProvider>
        <Screen key="b" speech="Tela B" />
        <Spy />
      </ScreenProvider>,
    );

    expect(current).toEqual({ speech: 'Tela B', actions: [] });
  });

  it('desmontar a tela limpa a fala e as ações', () => {
    const { rerender } = renderWithProvider(
      <Screen speech="Tela A" actions={[{ id: 'retry', label: 'Tentar', run: vi.fn() }]} />,
    );

    rerender(
      <ScreenProvider>
        <Spy />
      </ScreenProvider>,
    );

    expect(current).toEqual({ speech: '', actions: [] });
  });

  it('a ação chama sempre a versão mais recente do callback, sem loop de renderização', () => {
    const calls: number[] = [];

    function Counter() {
      const [count, setCount] = useState(0);
      // Array novo a cada render, como uma tela faria naturalmente.
      useScreen({
        speech: 'Contador',
        actions: [{ id: 'capture', label: 'Capturar', run: () => calls.push(count) }],
      });
      return <button onClick={() => setCount((c) => c + 1)}>mais</button>;
    }

    renderWithProvider(<Counter />);
    act(() => screen.getByRole('button').click());
    act(() => current.actions[0]?.run());

    expect(calls).toEqual([1]);
  });

  it('fora do provider, useScreen não quebra a tela', () => {
    expect(() => render(<Screen speech="Sozinha" />)).not.toThrow();
  });
});
