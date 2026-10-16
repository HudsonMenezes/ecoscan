# EcoScan ♻️

Aponte a câmera para um objeto e descubra **o que ele é**, **como descartá-lo corretamente** e **o que acontece se for descartado no lugar errado**. Tudo também por voz, para quem não sabe ler ou escrever. Quem comprova o descarte no ponto de coleta ganha **XP** e **moedas**.

Projeto desenvolvido para um hackathon escolar com o tema **reciclagem** (Duque de Caxias, RJ).

**App no ar:** https://ecoscan-v1.vercel.app

> **Status:** v1 pronta para a demo. Testada num iPhone real (câmera, QR, voz e comandos pelo microfone); ainda não testada num Android real. Roteiro de apresentação: [`docs/DEMO.md`](docs/DEMO.md).

## Como funciona

1. **Escanear:** o usuário fotografa o objeto (ex.: uma pilha).
2. **Entender:** a IA identifica o item e o material, e o app mostra:
   - o que é e em qual lixeira vai (com a cor da coleta seletiva);
   - como descartar (ex.: "leve a um ponto de coleta de pilhas"), com os pontos oficiais de Duque de Caxias quando existem;
   - a consequência do descarte incorreto (ex.: "metais pesados contaminam o solo e a água").
3. **Ouvir e falar:** cada tela pode ser lida em voz alta, e a navegação aceita comandos de voz ("escanear", "capturar", "descartar", "minhas moedas", "ajuda").
4. **Descartar e ganhar:** no ponto de coleta, o usuário lê o QR code (pelo app ou pela câmera do celular) e recebe XP e moedas.

## Funcionalidades (v1)

| Módulo      | O que faz                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `app-shell` | PWA instalável, mobile-first, navegação por ícones grandes, câmera, boas-vindas e página Sobre |
| `scanner`   | Identificação por foto com OpenAI `gpt-5.4-mini` (visão) e textos educativos                   |
| `voice`     | Leitura em voz alta (Web Speech; `gpt-4o-mini-tts` como reserva) e comandos de voz             |
| `rewards`   | QR de demonstração que valida o descarte; XP, 6 níveis, moedas e histórico                     |

Mapa de módulos e ordem de construção: [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md).

**Fora da v1 (planejado):** vários pontos de coleta, troca de moedas por benefícios e contas com sincronização (Supabase).

## Stack

- React 19 + Vite 8 + TypeScript 6 (PWA com `vite-plugin-pwa`)
- Vercel Functions (`api/`): proxy que guarda a chave da OpenAI
- OpenAI API: `gpt-5.4-mini` (visão) e `gpt-4o-mini-tts` (voz de reserva)
- Zod, Vitest, Testing Library, Playwright; CI no GitHub Actions

## Rodando localmente

Requer **Node 24** (veja `.nvmrc`). Com Node 20, o `npm install` falha.

```bash
npm install
cp .env.example .env      # preencha OPENAI_API_KEY
npm run dev               # Vite com HTTPS local (para testar câmera e microfone no celular pela rede)
```

O `npm run dev` serve só o front-end. Para as funções de `api/`, o caminho normal é `npx vercel dev`, mas a CLI da Vercel 64.3.1 está quebrada (pede um `@vercel/build-utils` que não existe no npm). Enquanto isso, teste a API pelos testes de `api/` ou direto na produção.

| Comando                 | O que faz                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run build`         | Build de produção em `dist/`                                      |
| `npm test`              | Testes unitários (Vitest)                                         |
| `npm run test:e2e`      | Testes E2E (Playwright, com câmera e voz falsas e a CSP real)     |
| `npm run lint`          | ESLint                                                            |
| `npm run typecheck`     | TypeScript                                                        |
| `npm run format`        | Prettier (a CI confere a formatação)                              |
| `npm run check:secrets` | Falha se o `dist/` tiver a chave ou o nome de variáveis da OpenAI |
| `npm run eval:scanner`  | Avalia a IA com fotos de teste (**custa** ~US$ 0,10 por rodada)   |
| `npm run qr:demo`       | Gera a folha do QR de demonstração em `print/`                    |
| `npm run icons`         | Gera os ícones do PWA em `public/`                                |

## Variáveis de ambiente

| Variável            | Onde é usada      | Descrição                                                                                                         |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`    | `api/` (servidor) | Chave da OpenAI. **Nunca** expor no front                                                                         |
| `OPENAI_MODEL`      | `api/`            | Modelo de visão (padrão `gpt-5.4-mini`)                                                                           |
| `OPENAI_TTS_MODEL`  | `api/`            | Modelo de voz (padrão `gpt-4o-mini-tts`)                                                                          |
| `ALLOWED_ORIGIN`    | `api/`            | Origens aceitas nas chamadas a `/api/*`, separadas por vírgula                                                    |
| `VITE_TTS_PROVIDER` | front-end         | `openai` força a voz da OpenAI; sem isso, usa a do navegador e só recorre à OpenAI quando não há voz em português |
| `QR_BASE_URL`       | `npm run qr:demo` | Endereço que o QR impresso abre (padrão: produção)                                                                |

Em produção, configure as variáveis no painel da Vercel e marque `OPENAI_API_KEY` como _Sensitive_. Um push em `main` faz o deploy de produção.

## Segurança e privacidade

- A chave da OpenAI fica só no servidor (Vercel). O navegador nunca fala direto com a OpenAI, e a CI confere que a chave não vazou para o build (`check:secrets`).
- As fotos não são armazenadas (nem pela OpenAI: `store: false`), e os metadados (EXIF/GPS) são removidos antes do envio.
- Nenhum dado pessoal é coletado. XP e moedas ficam no próprio aparelho (localStorage).
- A fala só é enviada para o reconhecimento de voz do navegador quando o usuário toca no microfone.
- Proteções contra uso abusivo: limite de gasto no projeto da OpenAI, limite de requisições em `/api/*` no Vercel Firewall (60 por minuto por IP) e checagem de origem.
- CSP restrita (sem `unsafe-inline` nem `unsafe-eval`), aplicada também nos testes E2E.

Detalhes em [`docs/SPEC-app-shell.md`](docs/SPEC-app-shell.md#segurança-e-privacidade).

## Documentação

- [Roteiro da demo](docs/DEMO.md)
- [Mapa de capacidades](docs/CAPABILITY-MAP.md)
- [Spec: app-shell](docs/SPEC-app-shell.md)
- [Spec: scanner](docs/SPEC-scanner.md)
- [Spec: voice](docs/SPEC-voice.md)
- [Spec: rewards](docs/SPEC-rewards.md)
- Progresso e plano: [`tasks/`](tasks/)
