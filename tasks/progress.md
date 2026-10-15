# Progresso: EcoScan

> Ponto de retomada entre sessões. Atualize ao concluir cada tarefa.
> Última atualização: 2026-10-15

## Onde estamos

- **Fase atual:** 1, Fundação (`app-shell`)
- **Concluídas:** T1 (scaffold), T2 (deploy + `api/health` + headers), T3 (`AppStorage`), T4 (Home, rotas, ícones do PWA), T5 (`useScreen`), T6 (câmera), P2 (CI)
- **Em andamento:** **T6b: experiência no computador.** Código, testes e E2E prontos e no ar; **falta o Hudson ler o QR do banner com o celular**. Depois, marcar a T6b no `todo.md`.
- **Depois:** **Checkpoint A** (revisão com o Hudson)

## Como retomar

1. Ler, nesta ordem: [`docs/CAPABILITY-MAP.md`](../docs/CAPABILITY-MAP.md), a spec do módulo atual ([`docs/SPEC-app-shell.md`](../docs/SPEC-app-shell.md)) e a próxima tarefa em [`todo.md`](todo.md).
2. Garantir Node 24: `node -v` → `v24.22.0` (`.nvmrc`). Se aparecer v20: `nvm use 24.22.0` num terminal **como administrador**.
3. `npm install` e conferir que está tudo verde: `npm run lint && npm run typecheck && npm test`.

## Ambiente e infraestrutura

| Item               | Estado                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produção           | https://ecoscan-v1.vercel.app (`/api/health` → `{"ok":true,"openaiKey":true}`)                                                                                            |
| Vercel             | Projeto `hudsonmenezes-projects/ecoscan`, ligado ao GitHub (push em `main` = deploy de produção). CLI logada (`npx vercel ls ecoscan`, `npx vercel inspect --logs <url>`) |
| Env vars na Vercel | `OPENAI_API_KEY` (Secret), `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `ALLOWED_ORIGIN` (Production + Preview)                                                                    |
| `.env` local       | Tem a chave; `ALLOWED_ORIGIN=https://localhost:5173,http://localhost:3000`                                                                                                |
| CI                 | GitHub Actions (`.github/workflows/ci.yml`); repo público, status via `https://api.github.com/repos/HudsonMenezes/ecoscan/actions/runs`                                   |
| OpenAI             | Projeto "EcoScan" criado; **limite de gasto de US$ 5** definido (2026-10-15). **Pendente (P1):** regra de rate limit no Vercel Firewall para `/api/*`                     |

## Decisões e armadilhas já resolvidas

- **Node 24 LTS obrigatório.** Com Node 20, o npm mistura versões (Vitest 4/5, React Router 7/8) e falha com `ERESOLVE`/`edgesOut`.
- **Versões:** Vite 8, React 19, React Router 8 (importar `RouterProvider` de `react-router/dom`), TypeScript **6.0** (o `typescript-eslint` ainda não suporta o 7), ESLint 10, Vitest 5, Zod 4, `vite-plugin-pwa` 2.
- **Funções Vercel:** formato `export default { fetch(request) }`; em `api/` **não** há alias `@/` (usar import relativo com extensão `.js`, pois o tsconfig é `nodenext`); `api/_lib/` não vira endpoint; testes em `api/` ficam fora do deploy via `.vercelignore`.
- **`vercel.json`** fixa `framework: vite` e `outputDirectory: dist`, porque o preset do painel quebrava o deploy procurando a pasta `build`.
- **Testes de `api/`** usam `// @vitest-environment node` na primeira linha.
- **Commits** terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; e-mail do git: `hudson.bm23@gmail.com`.
- O Prettier formata também os `.md` (as tabelas ficam alinhadas). Rodar `npm run format` antes de commitar, porque a CI checa.
- **Rotas:** `createRoutes()` é uma fábrica de propósito. O React Router modifica os objetos `lazy` ao resolvê-los, e reaproveitar o mesmo array em dois routers (por exemplo, entre testes) gera 404 no carregamento direto da rota.
- **Ícones do PWA:** `npm run icons` gera o `favicon.svg` e os PNGs em `public/` (rasterizados com o Chromium do Playwright, sem dependência nova). Para mudar o desenho, editar `scripts/generate-icons.ts` e rodar de novo.
- **`useScreen`:** pode receber um array de ações novo a cada render. Ele só registra de novo quando a fala ou os pares id/rótulo mudam, e o `run` registrado sempre chama o callback mais recente. Fora do `ScreenProvider` (por exemplo, em testes de componente de uma tela) ele não faz nada.
- **E2E instável localmente:** com 6 navegadores em paralelo, o Chromium às vezes deixava sem resposta a requisição de um chunk lazy, e o precache do service worker piorava o problema. O `playwright.config.ts` agora bloqueia service workers e usa 3 workers localmente (96/96 estáveis). Para checar se há intermitência: `npx playwright test --repeat-each=5`.
- **E2E da câmera:** o Chromium precisa de `--use-fake-device-for-media-stream` **e** `--use-fake-ui-for-media-stream` (sem o segundo, o `getUserMedia` dá `NotSupportedError` mesmo com a permissão concedida). A câmera falsa entrega 640x480 ou 1920x1080, então os testes verificam "lado maior ≤ 1024", e não um tamanho fixo.
- **QR do site:** `npm run qr:site` gera `public/qr-site.svg` (commitado). A URL fica em `scripts/generate-site-qr.ts`; se o domínio mudar, rodar de novo.
- **Sem webcam no computador:** `useHasCamera` usa `enumerateDevices` (sem pedir permissão) e, só no desktop, esconde o "Abrir câmera". No celular a câmera é sempre oferecida, porque alguns navegadores só listam câmeras depois da permissão.
