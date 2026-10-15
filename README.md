# EcoScan ♻️

Aponte a câmera para um objeto e descubra **o que ele é**, **como descartá-lo corretamente** e **o que acontece se for descartado no lugar errado**. Tudo também por voz, para quem não sabe ler ou escrever. Quem comprova o descarte no ponto de coleta ganha **XP** e **moedas**.

Projeto desenvolvido para um hackathon escolar com o tema **reciclagem**.

> **Status:** em especificação. As specs estão em [`docs/`](docs/). O código ainda não foi iniciado.

## Como funciona

1. **Escanear:** o usuário fotografa o objeto (ex.: uma pilha).
2. **Entender:** a IA identifica o item e o material, e o app mostra:
   - o que é;
   - como descartar (ex.: "leve a um ponto de coleta de pilhas");
   - a consequência do descarte incorreto (ex.: "metais pesados contaminam o solo e a água").
3. **Ouvir:** o resultado pode ser lido em voz alta, e a navegação aceita comandos de voz.
4. **Descartar e ganhar:** no ponto de coleta, o usuário lê o QR code e recebe XP e moedas.

## Funcionalidades (v1)

| Módulo | O que faz |
|---|---|
| `app-shell` | PWA instalável, mobile-first, navegação por ícones grandes, acesso à câmera |
| `scanner` | Identificação por foto com OpenAI `gpt-5.4-mini` (visão) |
| `voice` | Leitura em voz alta (Web Speech; `gpt-4o-mini-tts` opcional) e comandos de voz |
| `rewards` | QR de demonstração que valida o descarte; XP, nível, moedas e extrato |

Mapa de módulos e ordem de construção: [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md).

**Fora da v1 (planejado):** vários pontos de coleta, troca de moedas por benefícios e contas com sincronização (Supabase).

## Stack

- React + Vite + TypeScript (PWA)
- Vercel Serverless Functions (`api/`), um proxy que guarda a chave da OpenAI
- OpenAI API: `gpt-5.4-mini` (visão) e `gpt-4o-mini-tts` (voz, opcional)
- Zod, Vitest, Testing Library, Playwright

## Rodando localmente

> Os comandos abaixo passam a valer depois que o projeto for criado (módulo `app-shell`).

```bash
npm install
cp .env.example .env      # preencha OPENAI_API_KEY
npx vercel dev            # front-end + funções em api/
```

Outros comandos: `npm run build`, `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`.

Câmera e microfone exigem HTTPS. Em desenvolvimento, `npm run dev` sobe o Vite com HTTPS local para testar no celular pela rede.

## Variáveis de ambiente

| Variável | Onde é usada | Descrição |
|---|---|---|
| `OPENAI_API_KEY` | `api/` (servidor) | Chave da OpenAI. **Nunca** expor no front |
| `OPENAI_MODEL` | `api/` | Modelo de visão (padrão `gpt-5.4-mini`) |
| `OPENAI_TTS_MODEL` | `api/` | Modelo de voz (padrão `gpt-4o-mini-tts`) |
| `ALLOWED_ORIGIN` | `api/` | Origem aceita nas chamadas a `/api/*` |
| `VITE_TTS_PROVIDER` | front-end | `browser` (padrão) ou `openai` |

Em produção, configure as variáveis no painel da Vercel e marque `OPENAI_API_KEY` como *Sensitive*.

## Segurança e privacidade

- A chave da OpenAI fica só no servidor (Vercel). O navegador nunca fala direto com a OpenAI.
- As fotos não são armazenadas, e os metadados (EXIF/GPS) são removidos antes do envio.
- Nenhum dado pessoal é coletado. XP e moedas ficam no próprio aparelho (localStorage).
- O projeto da OpenAI tem limite de gasto, e o endpoint tem rate limit.

Detalhes em [`docs/SPEC-app-shell.md`](docs/SPEC-app-shell.md#segurança-e-privacidade).

## Documentação

- [Mapa de capacidades](docs/CAPABILITY-MAP.md)
- [Spec: app-shell](docs/SPEC-app-shell.md)
