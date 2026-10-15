# Progresso: EcoScan

> Ponto de retomada entre sessões. Atualize ao concluir cada tarefa.
> Última atualização: 2026-10-15

## Onde estamos

- **Fase atual:** 1, Fundação (`app-shell`)
- **Concluídas:** T1 (scaffold), T2 (deploy + `api/health` + headers), T3 (`AppStorage`), P2 (CI)
- **Próxima:** **T4: Layout, Home e rotas** (ver [`todo.md`](todo.md)). Inclui os ícones PNG do PWA.
- **Depois:** T5 (`useScreen`) → T6 (câmera; precisa de teste no celular real) → T6b (experiência no computador) → **Checkpoint A** (revisão com o Hudson)

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
| OpenAI             | Projeto "EcoScan" criado. **Pendente (P1):** confirmar o limite de gasto e a regra de rate limit no Vercel Firewall                                                       |

## Decisões e armadilhas já resolvidas

- **Node 24 LTS obrigatório.** Com Node 20, o npm mistura versões (Vitest 4/5, React Router 7/8) e falha com `ERESOLVE`/`edgesOut`.
- **Versões:** Vite 8, React 19, React Router 8 (importar `RouterProvider` de `react-router/dom`), TypeScript **6.0** (o `typescript-eslint` ainda não suporta o 7), ESLint 10, Vitest 5, Zod 4, `vite-plugin-pwa` 2.
- **Funções Vercel:** formato `export default { fetch(request) }`; em `api/` **não** há alias `@/` (usar import relativo com extensão `.js`, pois o tsconfig é `nodenext`); `api/_lib/` não vira endpoint; testes em `api/` ficam fora do deploy via `.vercelignore`.
- **`vercel.json`** fixa `framework: vite` e `outputDirectory: dist`, porque o preset do painel quebrava o deploy procurando a pasta `build`.
- **Testes de `api/`** usam `// @vitest-environment node` na primeira linha.
- **Commits** terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; e-mail do git: `hudson.bm23@gmail.com`.
- O Prettier formata também os `.md` (as tabelas ficam alinhadas). Rodar `npm run format` antes de commitar, porque a CI checa.
