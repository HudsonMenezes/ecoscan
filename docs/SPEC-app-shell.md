# Spec: app-shell

> Módulo 1 de 4. Veja [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Status: **aprovada em 2026-10-15**.

## Objetivo

Criar a base sobre a qual `scanner`, `voice` e `rewards` serão construídos: um PWA instalável e mobile-first, com navegação que funcione **sem precisar ler** (ícones grandes, cores e áudio) e com acesso à câmera. Inclui uma camada de armazenamento trocável e um backend mínimo (serverless) que guarda as chaves da OpenAI.

**Usuários:** alunos e a comunidade escolar, inclusive pessoas não alfabetizadas, usando celulares Android ou iOS de entrada pelo navegador.

**Histórias de usuário:**
- Como usuário, abro o site no celular e vejo três botões grandes, com ícone e cor: **Escanear**, **Descartar (QR)** e **Minha carteira**.
- Como usuário, posso "instalar" o site na tela inicial e ele abre como um app.
- Como usuário que nega a câmera, ainda consigo enviar uma foto da galeria.
- Como desenvolvedor de outro módulo, uso `AppStorage` e `useCamera` sem saber onde os dados ficam guardados ou como a câmera é acessada.

## Stack

| Item | Escolha |
|---|---|
| Linguagem | TypeScript (strict) |
| UI | React + Vite |
| Rotas | React Router |
| PWA | `vite-plugin-pwa` (manifest + service worker para o app shell) |
| Validação | Zod (dados vindos do storage e da API) |
| Backend | Vercel Serverless Functions em `api/` (Node 20+) |
| Hospedagem | Vercel (HTTPS, necessário para câmera e microfone) |
| HTTPS local | `@vitejs/plugin-basic-ssl`, para testar a câmera no celular pela rede local |
| Testes | Vitest + Testing Library; Playwright para E2E |
| Qualidade | ESLint + Prettier |

As versões ficam fixadas no `package.json` no momento do scaffold (última estável de cada uma).

## Comandos

```
Instalar:      npm install
Dev (local):   npm run dev              # vite --host, com HTTPS local
Dev c/ API:    npx vercel dev           # sobe o front e o api/ juntos
Build:         npm run build            # tsc -b && vite build
Preview:       npm run preview
Lint:          npm run lint             # eslint . --max-warnings 0
Formatar:      npm run format           # prettier --write .
Testes:        npm test                 # vitest run
Cobertura:     npm test -- --coverage
E2E:           npm run test:e2e         # playwright test
Typecheck:     npm run typecheck        # tsc -b --noEmit
```

## Estrutura do projeto

```
api/                      → Funções serverless (proxy OpenAI). Só aqui existe OPENAI_API_KEY
  _lib/                   → Helpers do backend (cliente OpenAI, validação, erros)
src/
  app/                    → Rotas, layout, providers, registro do PWA
  modules/
    scanner/              → Implementado na SPEC-scanner
    voice/                → Implementado na SPEC-voice
    rewards/              → Implementado na SPEC-rewards
  shared/
    ui/                   → Componentes base (BigActionButton, Screen, IconLabel)
    lib/storage/          → Interface AppStorage + LocalStorageAdapter
    lib/camera/           → Hook useCamera + fallback de upload de arquivo
    lib/api/              → Cliente HTTP tipado para /api/*
  config/                 → Config pública (feature flags, constantes)
  test/                   → Setup do Vitest e mocks compartilhados
public/                   → Ícones do PWA, imagens
tests/e2e/                → Specs do Playwright
docs/                     → Mapa de capacidades e specs
```

Regra: um módulo **não importa** de outro módulo irmão por caminho interno. Ele consome apenas o `index.ts` público do outro (ex.: `voice` importa `@/modules/scanner`, nunca `@/modules/scanner/components/...`).

## Contratos que este módulo expõe

```ts
// src/shared/lib/storage/AppStorage.ts
import type { ZodType } from 'zod';

export interface AppStorage {
  get<T>(key: StorageKey, schema: ZodType<T>): T | null; // dados inválidos → null
  set<T>(key: StorageKey, value: T): void;
  remove(key: StorageKey): void;
}

export type StorageKey = `ecoscan:${string}`;
```

```ts
// src/shared/lib/camera/useCamera.ts
type CameraState =
  | { status: 'idle' | 'requesting' }
  | { status: 'ready'; stream: MediaStream }
  | { status: 'denied' | 'unavailable' }; // a UI mostra o fallback de upload

export function useCamera(): {
  state: CameraState;
  start(): Promise<void>;
  stop(): void;
  capture(): Promise<Blob>; // JPEG redimensionado para no máximo 1024px no lado maior
};
```

Rotas (os outros módulos preenchem as telas; o shell só cria placeholders):

| Rota | Tela | Dono |
|---|---|---|
| `/` | Home com 3 botões grandes | app-shell |
| `/escanear` | Câmera + resultado | scanner |
| `/descartar` | Leitor do QR de descarte | rewards |
| `/carteira` | XP, nível, moedas, extrato | rewards |

## Estilo de código

- Componentes em `PascalCase.tsx`, hooks em `useAlgo.ts`, utilitários em `camelCase.ts`.
- Named exports; sem `default export`, exceto nas rotas lazy.
- Texto da interface em pt-BR, centralizado em `src/config/strings.ts`, para o módulo `voice` poder ler as mesmas frases.
- Nada de `any`. Dados externos (storage, API) sempre passam por um schema Zod.

```tsx
// src/shared/ui/BigActionButton.tsx
type BigActionButtonProps = {
  to: string;
  icon: React.ReactNode;
  label: string;      // também é o texto falado pelo módulo voice
  color: 'green' | 'blue' | 'amber';
};

export function BigActionButton({ to, icon, label, color }: BigActionButtonProps) {
  return (
    <Link to={to} className={`big-action big-action--${color}`} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <span className="big-action__label">{label}</span>
    </Link>
  );
}
```

## Acessibilidade (requisito do projeto, não opcional)

- Alvos de toque de no mínimo 64px na home e 48px no resto.
- Cada ação tem ícone **e** cor distintos; o texto nunca é o único indicador.
- Contraste WCAG AA; fonte base de no mínimo 18px.
- Toda tela registra uma frase curta de "o que fazer aqui" em `strings.ts`, que o módulo `voice` lê.
- Funciona a partir de 360px de largura, sem scroll horizontal.

## Segurança e privacidade

Modelo de ameaça: o front é público e o usuário controla tudo que roda no navegador. A única coisa a proteger de verdade é a **chave da OpenAI e o crédito associado a ela**. Também é preciso proteger as **fotos**, que podem mostrar alunos menores de idade (LGPD).

| Risco | Mitigação |
|---|---|
| Vazamento da chave | `OPENAI_API_KEY` só como variável de ambiente da Vercel, marcada como *Sensitive*, e lida apenas em `api/`. O navegador nunca fala com a OpenAI. Ao fazer o build, verificar que a chave não está no bundle (`grep -r "sk-" dist/` precisa voltar vazio). |
| Abuso do endpoint (`/api/*` é público e pode gastar o crédito) | Limite de gasto (budget) no projeto da OpenAI; chave restrita por projeto; regra de rate limit no Vercel Firewall por IP; validar o tamanho (≤ 1 MB) e o tipo (`image/jpeg`) do payload com Zod; `max_output_tokens` fixo; checagem de `Origin` (só para barrar uso casual, porque pode ser falsificada) |
| Metadados da foto (GPS/EXIF) | `capture()` e o upload da galeria sempre passam por um canvas e são recodificados em JPEG, o que remove o EXIF |
| Retenção das fotos | O backend não grava imagens nem respostas; logs registram só status, latência e categoria. Nada de foto em `console.log` |
| Dados no localStorage | Só XP, moedas e histórico de categorias, sem nenhum dado pessoal. O usuário pode editar esses dados; isso é aceito na demo |
| XSS | Nada de `dangerouslySetInnerHTML`; o texto vindo da IA é renderizado como texto puro; CSP via `vercel.json` |

## Estratégia de testes

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest | `LocalStorageAdapter` (inclui JSON corrompido → `null`), redimensionamento do `capture()` |
| Componente | Testing Library | Home renderiza os 3 botões com `aria-label`; fallback de upload aparece quando a câmera é negada |
| E2E | Playwright (viewport Pixel 5, câmera falsa do Chromium) | Abrir home → navegar até cada rota; manifest do PWA válido |

Meta: 80% de cobertura em `src/shared/lib`. A UI é coberta pelos testes de componente e E2E, sem meta numérica.

## Limites

- **Sempre:** rodar `lint`, `typecheck` e `test` antes de considerar uma tarefa concluída; validar dados externos com Zod; manter textos em `strings.ts`; testar em viewport de 360px.
- **Perguntar antes:** adicionar dependências fora da stack acima; mudar a hospedagem (Vercel); introduzir Supabase ou login; mudar a estrutura de pastas ou os ids de módulo.
- **Nunca:** expor `OPENAI_API_KEY` no front-end (nada de `VITE_OPENAI_*`); commitar `.env`; gravar ou logar as fotos enviadas; usar a câmera ou o microfone sem uma ação explícita do usuário; depender só de texto para comunicar uma ação.

## Critérios de sucesso

- [ ] `npm run build`, `lint`, `typecheck` e `test` passam sem erros nem avisos.
- [ ] Deploy na Vercel acessível por HTTPS; o Lighthouse indica que o app é **instalável** e dá **Acessibilidade ≥ 95**.
- [ ] Home mostra os 3 botões e cada um leva à rota correta (E2E).
- [ ] Num celular real, `useCamera` abre a câmera traseira e `capture()` devolve um JPEG de no máximo 1024px.
- [ ] Se a câmera for negada, aparece o botão "Enviar foto" (input `accept="image/*" capture="environment"`).
- [ ] `AppStorage` devolve `null` para dados ausentes ou inválidos, sem lançar exceção.
- [ ] `api/health.ts` responde `200` e confirma que `OPENAI_API_KEY` está configurada, sem revelá-la.
- [ ] O bundle de produção (`dist/`) não contém a chave nem nenhuma variável `OPENAI_*`.
- [ ] O projeto da OpenAI tem limite de gasto configurado e a Vercel tem uma regra de rate limit para `/api/*`.
- [ ] Respostas incluem headers de segurança (CSP, `X-Content-Type-Options`, `Referrer-Policy`) definidos em `vercel.json`.

## Decisões

- Nome: **EcoScan** (definitivo).
- Identidade visual: neutra e funcional no MVP (verde/azul/âmbar para as ações). Será revista depois do MVP com sugestões dos alunos, então as cores ficam centralizadas em variáveis CSS.
- Deploy: conta Vercel pessoal do desenvolvedor.

## Perguntas em aberto

- Nenhuma no momento.
