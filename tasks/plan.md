# Plano de implementação: EcoScan

> Baseado nas specs aprovadas em [`docs/`](../docs/CAPABILITY-MAP.md). Tarefas detalhadas (critérios, verificação, arquivos) em [`todo.md`](todo.md).
> Status: **aprovado em 2026-10-15**.

## Visão geral

O EcoScan é um PWA (React + Vite + TS) com funções serverless na Vercel. O usuário fotografa um objeto, o `gpt-5.4-mini` classifica o item numa das 12 categorias de descarte, e o app explica como descartar e as consequências do descarte incorreto. Tudo pode ser ouvido e comandado por voz. Ler o QR do ponto de coleta credita XP e moedas num ledger local.

A ordem segue o mapa: **app-shell → scanner → (voice ∥ rewards) → endurecimento e demo**. Dentro de cada módulo o trabalho é dividido em **fatias verticais**, para que cada tarefa termine com algo funcionando e testado.

## Decisões de arquitetura

- **Deploy primeiro (T2).** Câmera e microfone exigem HTTPS, e o comportamento real só aparece no celular. Ter a URL da Vercel no ar desde o início permite testar cada fatia no aparelho.
- **Risco da IA cedo (T9).** O eval do scanner roda antes da UI completa. Se a acurácia ficar abaixo de 85%, o prompt é ajustado antes de construir o resto em cima dele.
- **Regras puras + adaptadores finos.** `claimDisposal`, `getWallet`, `parseCommand`, `applyConfidenceRules` e `pickPtBrVoice` são funções puras com TDD. Hooks e componentes só ligam essas funções à UI.
- **Contratos compartilhados via `src/shared`.** O schema `ScanResult` é usado pelo `api/` e pelo front, e só existe uma fonte de verdade.
- **`src/app` é a raiz de composição.** Só ela importa módulos para montar layout e rotas (`VoiceDock`, telas).

## Fases e tarefas

| Fase                    | Tarefas                                       | Módulo    |
| ----------------------- | --------------------------------------------- | --------- |
| 1. Fundação             | T1–T6b                                        | app-shell |
| ✅ Checkpoint A         | app-shell completo e no ar                    |           |
| 2. Scanner              | T7–T12                                        | scanner   |
| ✅ Checkpoint B         | escanear no celular real funciona; eval ≥ 85% |           |
| 3a. Rewards             | R1–R6                                         | rewards   |
| 3b. Voice               | V1–V6                                         | voice     |
| ✅ Checkpoint C         | fluxo completo por toque **e** por voz        |           |
| 4. Endurecimento e demo | P1–P3                                         | todos     |
| ✅ Checkpoint final     | todos os critérios de sucesso das 4 specs     |           |

As fases 3a e 3b são independentes e podem ser feitas em paralelo, porque `voice` e `rewards` não se importam.

## Passos que dependem de você

| Quando      | O quê                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Antes de T2 | `npx vercel login` + `npx vercel link` (sua conta); criar a chave da OpenAI num **projeto dedicado** |
| T2          | Configurar as env vars na Vercel (`OPENAI_API_KEY` como _Sensitive_)                                 |
| P1          | Limite de gasto no projeto da OpenAI; regra de rate limit no Vercel Firewall                         |
| R5 / P3     | Imprimir o QR; testar num Android **e** num iPhone reais                                             |

## Riscos e mitigações

| Risco                                                                       | Impacto | Mitigação                                                                                            |
| --------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| Acurácia da IA abaixo de 85%, ou item perigoso classificado como lixo comum | Alto    | Eval em T9, antes da UI; exemplos no prompt; regra de confiança baixa → "tente de novo"              |
| Nome/parâmetros do `gpt-5.4-mini` diferentes do esperado                    | Médio   | Em T8, conferir na documentação oficial da OpenAI antes de codar; o modelo fica em `OPENAI_MODEL`    |
| iOS: `SpeechRecognition` parcial e sem `BarcodeDetector`                    | Médio   | Detecção de recurso (o 🎤 some); `jsQR` como fallback; teste em iPhone real no Checkpoint C          |
| Aparelho sem voz pt-BR                                                      | Médio   | Reserva automática para o `gpt-4o-mini-tts` (V3)                                                     |
| Abuso de `/api/*` gastando o crédito                                        | Alto    | Budget na OpenAI + rate limit + validação (P1); Origin check desde T2                                |
| Poucas fontes oficiais sobre ecopontos de Duque de Caxias                   | Baixo   | Categorias sem fonte ficam com a orientação genérica (decisão da spec)                               |
| Rate limit do Vercel Firewall indisponível no seu plano                     | Médio   | Conferir em P1; alternativa: limitador em memória por instância (fraco) ou Upstash (perguntar antes) |
| Fotos de banco limpas demais inflando o eval                                | Médio   | Mínimo de 5 imagens "difíceis"; trocar por fotos reais quando houver                                 |

## Decisões do plano

- **Domínio de produção:** `https://ecoscan-v1.vercel.app` (já reservado). É o `ALLOWED_ORIGIN` de produção e o `QR_BASE_URL` do QR de demonstração.
- **CI no GitHub Actions:** incluída (P2), aprovada em 2026-10-15.

## Perguntas em aberto

- Nenhuma no momento.
