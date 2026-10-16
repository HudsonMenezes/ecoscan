# Tarefas: EcoScan

> **Retomando? Comece por [`progress.md`](progress.md).** · Plano: [`plan.md`](plan.md) · Specs: [`docs/`](../docs/CAPABILITY-MAP.md)
> Definição de pronto (vale para toda tarefa): `npm run lint`, `npm run typecheck` e `npm test` limpos; build ok; commit pequeno referenciando a tarefa (ex.: `feat(scanner): T8 …`).
> Tamanhos: XS (1 arquivo) · S (1–2) · M (3–5). Arquivos de configuração do scaffold não contam no limite.

---

## Fase 1: Fundação (`app-shell`)

- [x] **T1: Scaffold do projeto** · M · deps: —
  - Vite + React + TS strict, alias `@/`, ESLint + Prettier, Vitest + Testing Library + setup, Playwright, `vite-plugin-pwa` (manifest mínimo), `@vitejs/plugin-basic-ssl`; scripts do `package.json` iguais à spec. Substitui o `index.html` vazio.
  - **Aceite:** todos os comandos da seção "Comandos" da spec existem e rodam; um teste de exemplo passa; `npm run dev` abre em HTTPS na rede local.
  - **Verificar:** `npm run build && npm run lint && npm run typecheck && npm test`
  - **Arquivos:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `index.html`, `src/main.tsx`, `src/test/setup.ts`, `playwright.config.ts`

- [x] **T2: Deploy na Vercel + `api/health` + headers de segurança** · S · deps: T1 · 👤 precisa de você (login/link Vercel, env vars)
  - `api/health.ts` (200, informa se a chave existe sem revelá-la); `api/_lib/http.ts` (`assertAllowedOrigin`, `jsonError`); `vercel.json` com CSP, `X-Content-Type-Options` e `Referrer-Policy`.
  - Domínio: `ecoscan-v1.vercel.app`; `ALLOWED_ORIGIN` aceita produção + `localhost` (deploys de preview via `VERCEL_URL`).
  - **Aceite:** `https://ecoscan-v1.vercel.app` no ar; `/api/health` → `{ ok: true, openaiKey: true }`; headers presentes; teste do handler com origem inválida → 403.
  - **Verificar:** `npm test`; `curl -I <url>` mostra os headers; `curl <url>/api/health`
  - **Arquivos:** `api/health.ts`, `api/_lib/http.ts`, `api/_lib/http.test.ts`, `vercel.json`

- [x] **T3: `AppStorage` + `LocalStorageAdapter`** · S · deps: T1
  - Implementação com TDD conforme o contrato da spec, com chaves `ecoscan:*` e validação Zod.
  - **Aceite:** dado ausente, JSON corrompido ou schema inválido → `null`, sem exceção; `set`/`get`/`remove` funcionam; cobertura ≥ 80%.
  - **Verificar:** `npm test -- src/shared/lib/storage`
  - **Arquivos:** `src/shared/lib/storage/AppStorage.ts`, `LocalStorageAdapter.ts`, `LocalStorageAdapter.test.ts`, `index.ts`

- [x] **T4: Layout, Home e rotas** · M · deps: T1
  - Router com `/`, `/escanear`, `/descartar` e `/carteira` (placeholders lazy); `BigActionButton`; `strings.ts`; tokens de cor em variáveis CSS (verde/azul/âmbar); alvos ≥ 64px; fonte ≥ 18px.
  - **Aceite:** a Home mostra 3 botões com ícone, cor e `aria-label`, e cada um navega; sem scroll horizontal em 360px.
  - **Verificar:** teste de componente da Home; E2E de smoke (viewport Pixel 5) navegando pelas 4 rotas
  - **Arquivos:** `src/app/router.tsx`, `src/app/Layout.tsx`, `src/app/HomeScreen.tsx`, `src/shared/ui/BigActionButton.tsx`, `src/config/strings.ts` (+ `src/styles/tokens.css`, `tests/e2e/smoke.spec.ts`)
  - Inclui os ícones PNG do PWA (192px, 512px e maskable): o manifest da T1 só tem o `favicon.svg`, e o Lighthouse exige PNG para considerar o app instalável.

- [x] **T5: `ScreenContext` + `useScreen`** · S · deps: T4
  - Provider no Layout; `useScreen({ speech, actions })` registra e limpa ao desmontar; `useCurrentScreen()`. A Home registra a fala dela.
  - **Aceite:** trocar de rota troca o `speech`/`actions` atual; desmontar limpa as ações.
  - **Verificar:** `npm test -- src/shared/lib/screen`
  - **Arquivos:** `src/shared/lib/screen/ScreenContext.tsx`, `useScreen.ts`, `useScreen.test.tsx`

- [x] **T6: `useCamera` + captura sem EXIF + fallback de upload** · M · deps: T4
  - `getUserMedia` com `facingMode: { ideal: 'environment' }`; estados da spec; `capture()` → canvas → JPEG ≤ 1024px; o upload passa pelo mesmo redimensionamento. Câmera frontal/webcam → preview espelhado, foto **não** espelhada. `CameraView` de teste em `/escanear` (provisório).
  - **Aceite:** câmera negada ou ausente → "Enviar foto"; saída ≤ 1024px e sem EXIF; webcam espelhada só no preview.
  - **Verificar:** testes unitários de `resizeImage` e do fallback; **manual:** câmera traseira no celular real **e** webcam no computador, pela URL da Vercel
  - **Feito (2026-10-15):** celular real ok. Webcam não testada manualmente (o computador do Hudson não tem câmera; o caso "sem câmera" foi validado). `Enviar foto` ficou **sem** `capture` para oferecer a galeria.
  - **Arquivos:** `src/shared/lib/camera/useCamera.ts`, `resizeImage.ts`, `resizeImage.test.ts`, `src/shared/ui/CameraView.tsx`, `CameraView.test.tsx`

- [x] **T6b: Experiência no computador (lado a lado, arrastar e soltar, "Melhor no celular")** · M · deps: T6
  - Em `pointer: fine`, câmera e "Enviar foto" lado a lado, com área de arrastar e soltar; `DesktopHint` com QR estático do site (`npm run qr:site` → `public/qr-site.svg`, `qrcode` em devDependencies), dispensável e salvo em `ecoscan:desktop-hint-dismissed`.
  - **Aceite:** no desktop, o layout lado a lado e o arrastar e soltar funcionam; o banner aparece só sem toque e some ao dispensar (persistindo); o QR abre `https://ecoscan-v1.vercel.app`; o celular não muda.
  - **Verificar:** testes de componente (mock de `matchMedia`); E2E em viewport desktop; ler o QR da tela com o celular
  - **Arquivos:** `src/shared/ui/CameraView.tsx`, `src/shared/ui/ImageDropZone.tsx`, `src/app/DesktopHint.tsx`, `scripts/generate-site-qr.ts`, `*.test.tsx`

### ✅ Checkpoint A: app-shell

- [x] Todos os critérios de sucesso da [SPEC-app-shell](../docs/SPEC-app-shell.md#critérios-de-sucesso), exceto rate limit e budget (ficam para P1)
- [x] Lighthouse no deploy: instalável, Acessibilidade ≥ 95 (2026-10-15: Acessibilidade 100, Boas práticas 100, Performance 99–100 nas 4 rotas; instalabilidade via CDP `Page.getInstallabilityErrors` sem erros, porque o Lighthouse 12 não tem mais a categoria PWA)
- [x] `grep -r "sk-" dist/` vazio (o literal acha `mask-type` do React DOM; o padrão de chave real `sk-[A-Za-z0-9_-]{20,}` volta vazio; a P1 automatiza isso com esse padrão)
- [x] **Revisão com você antes de seguir** (aprovado em 2026-10-15)

---

## Fase 2: Scanner

- [x] **T7: Modelo do scanner (categorias + `ScanResult` + regras de confiança)** · S · deps: T1
  - Catálogo das 12 categorias (rótulo, cor CONAMA, ícone, destino); `ScanResultSchema` e `CategorySchema` em `src/shared`; `applyConfidenceRules`.
  - **Aceite:** `baixa`/`identified:false` → `desconhecido`; o schema rejeita textos acima dos limites; o enum bate com a tabela da spec.
  - **Verificar:** `npm test -- scanner/model`
  - **Arquivos:** `src/modules/scanner/model/categories.ts`, `src/shared/contracts/scanResult.ts`, `applyConfidenceRules.ts`, `*.test.ts`

- [x] **T8: `POST /api/scan` (OpenAI + Structured Outputs)** · M · deps: T2, T7
  - Conferir na documentação oficial o nome do modelo, a Responses API, `json_schema strict`, `input_image` e o parâmetro de raciocínio. Prompt v1 com os exemplos de itens compostos, regras de segurança e `PROMPT_VERSION`. Validação de origem e payload (≤ 1 MB, JPEG); timeout de 20 s; 1 retry; logs sem imagem.
  - **Aceite:** testes com cliente mockado cobrem 400/403/413/502/504 e o retry; uma chamada real via `vercel dev` com uma foto de pilha devolve `pilhas_baterias`.
  - **Verificar:** `npm test -- api/scan`; `curl` local com uma imagem de teste
  - **Arquivos:** `api/scan.ts`, `api/scan.test.ts`, `api/_lib/openai.ts`, `api/_lib/prompts/scan.ts`

- [x] **T9: Conjunto de eval + script (risco: rodar cedo)** · M · deps: T8
  - Montar 22 imagens de bancos livres (≥ 5 difíceis, sem pessoas) com `SOURCES.md` (URL, autor, licença); `expected.json`; `npm run eval:scanner` com relatório de acurácia, falhas perigosas e latência p50/p95.
  - **Aceite:** acurácia ≥ 85% (≥ 19/22), **zero** perigosos classificados errado, p50 ≤ 5 s e p95 ≤ 10 s. Se falhar: iterar o prompt (subindo `PROMPT_VERSION`) até passar, ou trazer para você decidir.
  - **Verificar:** `npm run eval:scanner` (relatório colado na descrição do commit)
  - **Arquivos:** `tests/eval/scanner/*` (imagens, `expected.json`, `SOURCES.md`), `scripts/eval-scanner.ts`

- [x] **T10: Cliente + `useScan` + `LastScan`** · M · deps: T7, T8, T3
  - `scanImage()` (fetch + Zod + mapeamento de erros para mensagens); máquina de estados `useScan`; `getLastScan`/`saveLastScan` com `id` uuid (não salva `desconhecido`); `index.ts` público.
  - **Aceite:** transições idle → capturing → loading → result | error testadas; `desconhecido` não persiste; erros de rede/429/5xx viram mensagens amigáveis.
  - **Verificar:** `npm test -- scanner`
  - **Arquivos:** `src/modules/scanner/api/scanImage.ts`, `hooks/useScan.ts`, `model/lastScan.ts`, `index.ts`, `*.test.ts`

- [x] **T11: Telas do scanner (ScanScreen, ResultCard, RetryHint)** · M · deps: T6, T10, T5
  - Substitui o `CameraView` provisório; ResultCard com cor/ícone do catálogo, "Por que aqui?" para itens compostos, botão Descartar → `/descartar`; registra `speech` (`spokenSummary` + `categoryReason`) e a ação `capture` via `useScreen`. O texto da IA é renderizado como texto puro.
  - **Aceite:** estados carregando/resultado/tente-de-novo/erro renderizados; o bloco composto só aparece com `isComposite`; fala e ações registradas.
  - **Verificar:** testes de componente; **manual:** escanear uma pilha real pelo celular e um objeto pela webcam do computador (layout lado a lado da T6b mantido)
  - **Arquivos:** `src/modules/scanner/components/ScanScreen.tsx`, `ResultCard.tsx`, `RetryHint.tsx`, `*.test.tsx`

- [x] **T12: Orientação local de Duque de Caxias + E2E do scanner** · M · deps: T11
  - Pesquisar fontes **oficiais** (prefeitura, programas de logística reversa) e preencher `localGuidance.ts` com URL e data de verificação; bloco "Em Duque de Caxias" no ResultCard. E2E: câmera falsa + `/api/scan` interceptado → ResultCard com a cor certa → Descartar leva a `/descartar`.
  - **Aceite:** toda entrada tem fonte e data; categorias sem fonte não mostram o bloco; E2E verde.
  - **Verificar:** `npm run test:e2e -- scanner`; revisar as fontes listadas no commit
  - **Arquivos:** `src/modules/scanner/model/localGuidance.ts`, `components/LocalGuidance.tsx`, `tests/e2e/scanner.spec.ts`

### ✅ Checkpoint B: scanner

- [x] Critérios da [SPEC-scanner](../docs/SPEC-scanner.md#critérios-de-sucesso) atendidos (eval, injeção de prompt, foto vazia, retry)
- [x] Deploy atualizado; escanear objetos reais no celular (Hudson: pano de microfibra e relógio, 2026-10-15)
- [x] Logs da Vercel sem imagens (conferido pelo Hudson em 2026-10-15)
- [x] **Revisão com você antes de seguir** (aprovado pelo Hudson em 2026-10-15, com o box vermelho de "O que acontece se descartar errado?")

---

## Fase 3a: Rewards (paralela à 3b)

- [x] **R1: Níveis, regras de recompensa e ledger** · S · deps: T3, T7
  - `levels.ts`, `rewardRules.ts`, `ledger.ts` (schema + `getWallet`), com TDD.
  - **Aceite:** fronteiras 49/50 e 799/800 corretas; progresso 0..1; ledger inválido → carteira vazia; 100% de cobertura de linhas.
  - **Verificar:** `npm test -- rewards/model -- --coverage`
  - **Arquivos:** `src/modules/rewards/model/levels.ts`, `rewardRules.ts`, `ledger.ts`, `*.test.ts`

- [x] **R2: `claimDisposal` + pontos + `parsePointUrl`** · S · deps: R1, T10
  - Funções puras com relógio injetado; `COLLECTION_POINTS` com `escola-demo`.
  - **Aceite:** cada `ClaimError` e o caminho feliz testados; expiração exatamente em 10 min; **dois scans distintos do mesmo material são ambos recompensados**; mesmo `scanId` → `already_claimed`.
  - **Verificar:** `npm test -- rewards/model rewards/qr`
  - **Arquivos:** `model/claimDisposal.ts`, `model/points.ts`, `qr/parsePointUrl.ts`, `*.test.ts`

- [x] **R3: Fluxo de descarte via link (`/descartar?ponto=`)** · M · deps: R2, T5
  - `useDisposal` (lê LastScan + ledger, chama `claimDisposal`, persiste); `DiscardScreen` com sucesso/erros e ações; `Celebration` (animação, som, comemoração de nível); registra `speech`.
  - **Aceite:** abrir `/descartar?ponto=escola-demo` com scan válido credita e comemora; cada erro mostra a mensagem e o botão da spec.
  - **Verificar:** testes de componente; manual pelo link no celular
  - **Arquivos:** `hooks/useDisposal.ts`, `components/DiscardScreen.tsx`, `components/Celebration.tsx`, `*.test.tsx`

- [x] **R4: Leitor de QR dentro do app** · S · deps: R3, T6
  - `useQrReader`: `BarcodeDetector` quando existe, `jsQR` como fallback; integra ao `DiscardScreen` quando não há `?ponto`.
  - **Aceite:** lê o QR no Android (nativo) e no iPhone (jsQR); QR de outro site → "não é um ponto do EcoScan".
  - **Verificar:** teste unitário com frame de imagem de QR; manual nos dois aparelhos
  - **Arquivos:** `qr/useQrReader.ts`, `qr/useQrReader.test.ts`, `components/DiscardScreen.tsx`

- [x] **R5: Gerador do QR de demonstração + página A4** · S · deps: R2 · 👤 imprimir
  - `npm run qr:demo` lê `QR_BASE_URL` e gera SVG, PNG 1024px e HTML A4 em `print/`; o PNG fica commitado.
  - **Aceite:** o QR gerado abre `<produção>/descartar?ponto=escola-demo` pela câmera nativa.
  - **Verificar:** rodar o script; ler o PNG com o celular
  - **Arquivos:** `scripts/generate-qr.ts`, `print/qr-escola-demo.{svg,png,html}`

- [x] **R6: Carteira + E2E de rewards** · M · deps: R3
  - `WalletScreen` (nível com ícone, barra de XP, moedas, histórico com cor/ícone da categoria); `speech` com saldo e quanto falta para o próximo nível. E2E da spec (incluindo repetição da URL e um segundo scan do mesmo material).
  - **Aceite:** a carteira reflete o ledger; E2E verde.
  - **Verificar:** `npm run test:e2e -- rewards`
  - **Arquivos:** `components/WalletScreen.tsx`, `WalletScreen.test.tsx`, `tests/e2e/rewards.spec.ts`

## U1: Nova identidade visual (aprovada pelo Hudson em 2026-10-15)

Proposta no canvas [EcoScan: proposta visual](https://claude.ai/artifact/EjUwYjn4NwZHzS13J7iDTs): fundo creme, cartões brancos, verde-floresta `#0E5F3A` + verde-broto `#B8E04A`, Bricolage Grotesque + Figtree (auto-hospedadas, por causa da CSP), ícones em traço (sem emoji, inclusive nos níveis), barra de navegação inferior, resumo do jogador no Início, botão fixo "Descartar no ponto" no Resultado e trilha de níveis na Carteira. Cores CONAMA das categorias mantidas. Feita antes da fase 3b porque muda a navegação.

- [x] **U1a: Base visual** · tokens, fontes em `public/fonts/`, botões, cartões, ícones de nível
- [x] **U1b: Navegação e Início** · cabeçalho, barra inferior, resumo do jogador, dica rápida
- [x] **U1c: Scanner** · câmera escura com moldura, resultado em cartões com botão fixo
- [x] **U1d: Descarte e Carteira** · comemoração em tela verde, leitor de QR, trilha de níveis
  - **Aceite (U1):** telas batem com o canvas; contraste AA; alvos de toque ≥ 44px; funciona em 360px; todos os testes verdes; print de cada tela revisado.

## Fase 3b: Voice (paralela à 3a)

- [x] **V1: `parseCommand` + tabela de comandos** · S · deps: T5
  - Normalização (acentos, maiúsculas, pontuação); intenções de navegação, `repeat`, `help`, `action:<id>`, desconhecido. TDD table-driven.
  - **Aceite:** 100% dos sinônimos da spec reconhecidos com e sem acento; as ações da tela atual são reconhecidas pelos rótulos.
  - **Verificar:** `npm test -- voice/model`
  - **Arquivos:** `src/modules/voice/model/commands.ts`, `parseCommand.ts`, `parseCommand.test.ts`

- [x] **V2: TTS do navegador + VoiceDock (🔊 e Modo voz)** · M · deps: T5
  - `pickPtBrVoice`, `browserTts`, `useSpeech` (só browser por enquanto); `VoiceDock` montado em `src/app`; Modo voz persistido em `ecoscan:voice-settings` e fala automática ao trocar de tela.
  - **Aceite:** 🔊 lê o `speech` da tela e um segundo toque para a fala; com o Modo voz ligado, a tela fala ao abrir.
  - **Verificar:** testes unitários e de componente com `speechSynthesis` falso; manual no celular
  - **Arquivos:** `tts/browserTts.ts`, `tts/useSpeech.ts`, `components/VoiceDock.tsx`, `*.test.ts(x)`, `src/app/Layout.tsx`

- [x] **V3: `/api/tts` + reserva OpenAI com cache** · M · deps: V2, T2
  - Handler com Zod (1–600 caracteres), origem e instruções de estilo; `openaiTts` com cache em memória; `useSpeech` cai para OpenAI sem voz pt-BR ou com `VITE_TTS_PROVIDER=openai`.
  - **Aceite:** testes do handler (400/403/`audio/mpeg`); o fallback é acionado sem voz pt-BR; "repetir" não chama a API de novo.
  - **Verificar:** `npm test -- api/tts voice/tts`; manual forçando `VITE_TTS_PROVIDER=openai`
  - **Arquivos:** `api/tts.ts`, `api/tts.test.ts`, `src/modules/voice/tts/openaiTts.ts`, `tts/useSpeech.ts`

- [x] **V4: Comandos de voz (🎤)** · M · deps: V1, V2
  - `useVoiceCommand` (detecção de suporte, pt-BR, uma frase, indicador visual); o 🎤 no VoiceDock despacha as intenções (navegar, repetir, ajuda, ações da tela; desconhecido → sugestões faladas).
  - **Aceite:** o 🎤 some sem suporte (Firefox, sem erro no console); "escanear" na Home → `/escanear`; "capturar" na tela do scanner dispara a captura.
  - **Verificar:** testes com `SpeechRecognition` falso; manual Android + iPhone
  - **Arquivos:** `stt/useVoiceCommand.ts`, `stt/useVoiceCommand.test.ts`, `components/VoiceDock.tsx`

- [x] **V5: WelcomeGate + aviso de privacidade + página Sobre** · S · deps: V2
  - Primeira visita: botão "▶️ Começar" desbloqueia o áudio, fala a apresentação e liga o Modo voz; aviso de privacidade do reconhecimento de voz; rota `/sobre`.
  - **Aceite:** aparece só na primeira visita; o aviso está presente nas duas telas.
  - **Verificar:** testes de componente
  - **Arquivos:** `components/WelcomeGate.tsx`, `WelcomeGate.test.tsx`, `src/app/AboutScreen.tsx`, `src/config/strings.ts`

- [x] **V6: E2E de voz** · S · deps: V4, V5, T11
  - `speechSynthesis` e `SpeechRecognition` falsos via `addInitScript`; roteiro: "escanear" → captura por voz → "repetir" fala o `spokenSummary`.
  - **Aceite:** E2E verde.
  - **Verificar:** `npm run test:e2e -- voice`
  - **Arquivos:** `tests/e2e/voice.spec.ts`, `tests/e2e/fakes/speech.ts`

### ✅ Checkpoint C: experiência completa

- [x] Critérios da [SPEC-voice](../docs/SPEC-voice.md#critérios-de-sucesso) e da [SPEC-rewards](../docs/SPEC-rewards.md#critérios-de-sucesso)
- [x] Roteiro completo **só por voz**: escanear → ouvir → descartar pelo QR impresso → ouvir o saldo
- [x] Testado num iPhone real (vozes, comandos pelo 🎤 e boas-vindas). **Android não testado:** o Hudson não tinha um à mão e aceitou o risco (2026-10-16)
- [x] **Revisão com você antes de seguir** (aprovada em 2026-10-16)

---

## Fase 4: Endurecimento e demo

- [x] **P1: Endurecimento de segurança** · S · deps: Checkpoint C · 👤 budget e firewall
  - Script `check:secrets` (falha se o `dist/` tiver `sk-` ou `OPENAI_`); revisão final da CSP; confirmar o budget da OpenAI e a regra de rate limit no Vercel Firewall para `/api/*`.
  - **Aceite:** `npm run check:secrets` verde; rajada de requisições a `/api/scan` → 429; budget configurado (print/confirmação).
  - **Verificar:** script + teste manual de rajada
  - **Arquivos:** `scripts/check-secrets.ts`, `package.json`, `vercel.json`
  - **Concluída em 2026-10-16:** `check:secrets` (na CI), CSP mais restrita e aplicada nos E2E (`csp.spec.ts`), budget de US$ 5 (2026-10-15) e regra "Limite da API" no Vercel Firewall (`/api/` · 60 req/60 s por IP · 429). Rajada de 75 requisições a `/api/health` → 60 × 200 e 15 × 429.

- [x] **P2: CI no GitHub Actions** · S · deps: T1 · aprovada; pode ser feita logo após T1
  - Workflow: install → lint → typecheck → test → build → check:secrets → E2E (Chromium).
  - **Aceite:** o workflow passa no push para `main`.
  - **Verificar:** execução verde no GitHub
  - **Arquivos:** `.github/workflows/ci.yml`

- [ ] **P3: Ensaio da demo** · S · deps: P1
  - Lighthouse final; roteiro de apresentação para o hackathon (`docs/DEMO.md`); README atualizado (status, URL, como rodar); QR impresso testado no local.
  - **Aceite:** roteiro executado de ponta a ponta no celular sem falhas.
  - **Verificar:** ensaio manual
  - **Arquivos:** `docs/DEMO.md`, `README.md`

### ✅ Checkpoint final

- [ ] Todos os critérios de sucesso das 4 specs marcados
- [ ] Deploy de produção estável; README com a URL
- [ ] **Aprovação final com você**
