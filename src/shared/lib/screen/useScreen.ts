import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

export type ScreenAction = {
  id: 'capture' | 'retry' | 'discard' | 'scan-again' | 'wallet'; // ampliável
  label: string; // nome falado/mostrado
  run: () => void;
};

export type CurrentScreen = { speech: string; actions: ScreenAction[] };

type Registration = { token: symbol; screen: CurrentScreen };

export type ScreenRegistry = {
  register(registration: Registration): void;
  unregister(token: symbol): void;
};

export const EMPTY_SCREEN: CurrentScreen = { speech: '', actions: [] };

// Dois contextos: as telas só precisam do registro (estável) e não renderizam
// de novo quando a tela atual muda; quem lê (o voice) assina o valor.
export const ScreenRegistryContext = createContext<ScreenRegistry>({
  register: () => {},
  unregister: () => {},
});
export const CurrentScreenContext = createContext<CurrentScreen>(EMPTY_SCREEN);

// Cada tela declara o que pode ser falado e quais ações aceita por comando de voz.
// O voice lê isso pelo ScreenContext, sem importar nenhum módulo de tela.
export function useScreen({ speech, actions = [] }: { speech: string; actions?: ScreenAction[] }) {
  const registry = useContext(ScreenRegistryContext);

  // Callbacks mais recentes, para o `run` registrado nunca ficar velho.
  const latestActions = useRef(actions);
  useEffect(() => {
    latestActions.current = actions;
  });

  // Só registra de novo quando a fala ou a lista de ações (id + rótulo) muda.
  const actionsKey = JSON.stringify(actions.map(({ id, label }) => [id, label]));
  const screen = useMemo<CurrentScreen>(() => {
    const ids = JSON.parse(actionsKey) as [ScreenAction['id'], string][];
    return {
      speech,
      actions: ids.map(([id, label]) => ({
        id,
        label,
        run: () => latestActions.current.find((action) => action.id === id)?.run(),
      })),
    };
  }, [speech, actionsKey]);

  useEffect(() => {
    const token = Symbol('screen');
    registry.register({ token, screen });
    return () => registry.unregister(token);
  }, [registry, screen]);
}

export function useCurrentScreen(): CurrentScreen {
  return useContext(CurrentScreenContext);
}
