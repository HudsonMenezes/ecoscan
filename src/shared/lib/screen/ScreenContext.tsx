import { useMemo, useState } from 'react';
import {
  CurrentScreenContext,
  EMPTY_SCREEN,
  ScreenRegistryContext,
  type ScreenRegistry,
} from './useScreen';

type Current = { token: symbol | null; screen: typeof EMPTY_SCREEN };

export function ScreenProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Current>({ token: null, screen: EMPTY_SCREEN });

  const registry = useMemo<ScreenRegistry>(
    () => ({
      register: ({ token, screen }) => setCurrent({ token, screen }),
      // Só limpa se quem saiu ainda é a tela atual.
      unregister: (token) =>
        setCurrent((prev) => (prev.token === token ? { token: null, screen: EMPTY_SCREEN } : prev)),
    }),
    [],
  );

  return (
    <ScreenRegistryContext value={registry}>
      <CurrentScreenContext value={current.screen}>{children}</CurrentScreenContext>
    </ScreenRegistryContext>
  );
}
