import { createContext, useContext, type ReactNode } from 'react';

// Ferramentas que o app põe no topo de todas as telas (hoje, os botões de voz).
// Telas com barra própria (scanner em tela cheia, comemoração) renderizam
// <HeaderTools /> no topo delas, sem importar quem fornece as ferramentas.
const HeaderToolsContext = createContext<ReactNode>(null);

export function HeaderToolsProvider({
  tools,
  children,
}: {
  tools: ReactNode;
  children: ReactNode;
}) {
  return <HeaderToolsContext value={tools}>{children}</HeaderToolsContext>;
}

export function HeaderTools() {
  return <>{useContext(HeaderToolsContext)}</>;
}
