# Spec: voice

> Módulo 3 de 4. Depende de [`app-shell`](SPEC-app-shell.md). Veja [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Status: **rascunho, aguardando revisão**.

## Objetivo

Permitir que uma pessoa **que não sabe ler nem escrever** use o EcoScan do começo ao fim: ela **ouve** o que cada tela diz e **fala** para navegar e agir.

**Histórias de usuário:**
- Como usuário, em qualquer tela toco no botão grande 🔊 e ouço o que a tela diz e o que posso fazer nela.
- Como usuário, depois de escanear uma pilha, ouço: o que é, como descartar e o que acontece se descartar errado.
- Como usuário, toco no 🎤 e digo "escanear", "tirar foto", "descartar", "minhas moedas", "repetir" ou "ajuda", e o app faz isso.
- Como usuário, ligo o **Modo voz** uma vez, e a partir daí cada tela fala sozinha quando abre.

## Componentes da experiência

### VoiceDock (sempre visível)

Barra fixa no rodapé de todas as telas, montada pelo `src/app/` (raiz de composição):

| Botão | Ícone | Ação |
|---|---|---|
| Ouvir | 🔊 | Lê o `speech` da tela atual (`useCurrentScreen`). Se já estiver falando, para |
| Falar | 🎤 | Escuta um comando (push-to-talk, uma frase). Some se o navegador não suportar reconhecimento de voz |
| Modo voz | 🗣️ (liga/desliga) | Com ele ligado, cada tela fala sozinha ao abrir. Fica salvo em `ecoscan:voice-settings` |

Botões com no mínimo 64px, ícone + cor, e estado visual claro (ex.: animação de ondas enquanto fala ou escuta).

### Primeira visita

Navegadores bloqueiam áudio automático antes de o usuário tocar na tela. Por isso, na primeira visita aparece uma tela de boas-vindas com **um único botão grande** ("▶️ Começar"). O toque nele desbloqueia o áudio, fala uma apresentação curta e **liga o Modo voz por padrão**. O usuário pode desligar no 🗣️.

## Fala (TTS)

| Provedor | Quando é usado |
|---|---|
| `browser`: `speechSynthesis` | Padrão (`VITE_TTS_PROVIDER=browser`). Escolhe a melhor voz `pt-BR` disponível (prioridade para vozes locais/"natural"). Velocidade de 0,95 |
| `openai`: `POST /api/tts` → `gpt-4o-mini-tts` | **Reserva automática** quando o aparelho não tem voz `pt-BR`, ou forçado com `VITE_TTS_PROVIDER=openai` |

### API: `POST /api/tts`

```ts
// Request
{ text: string }          // 1–600 caracteres
// 200 → audio/mpeg (stream)
// 400 invalid_text · 403 forbidden_origin · 429 rate_limited · 502 tts_unavailable
```

- Modelo `process.env.OPENAI_TTS_MODEL` (padrão `gpt-4o-mini-tts`) com uma voz fixa. Instruções de estilo: *"português do Brasil, devagar, tom amigável e acolhedor, para crianças e adultos"*.
- Mesma proteção do `/api/scan`: origem, Zod, rate limit e limite de tamanho. O endpoint só aceita texto, então o pior abuso possível é gastar TTS, que fica limitado pelo budget da OpenAI.
- Cache no cliente: os áudios gerados ficam num `Map` em memória (chave = hash do texto) durante a sessão, para "repetir" não gerar uma nova chamada.

## Comandos de voz (STT)

- `SpeechRecognition` / `webkitSpeechRecognition`, com `lang = 'pt-BR'`, `interimResults = false` e uma frase por toque.
- **Detecção de suporte:** se a API não existir (ex.: Firefox), o 🎤 não aparece e o resto do app continua funcionando.
- O texto reconhecido é normalizado (minúsculas, sem acentos e sem pontuação) e comparado com uma tabela de frases. Não há IA nessa parte, porque o resultado precisa ser previsível e sem custo.

| Intenção | Frases (exemplos) | Efeito |
|---|---|---|
| `nav:home` | início, menu, voltar, começo | `/` |
| `nav:scan` | escanear, tirar foto, foto, câmera, o que é isso | `/escanear` |
| `nav:discard` | descartar, jogar fora, qr, ponto de coleta | `/descartar` |
| `nav:wallet` | carteira, moedas, pontos, saldo, meu nível | `/carteira` (a tela fala o saldo pelo `speech` dela) |
| `repeat` | repetir, de novo, ouvir, fala de novo | Relê o `speech` da tela |
| `help` | ajuda, o que eu posso falar | Fala os comandos disponíveis **nesta** tela |
| `action:<id>` | rótulos das `ScreenAction` da tela (ex.: "capturar", "tirar agora" para `capture`) | Executa `action.run()` |
| — | qualquer outra coisa | "Não entendi. Você pode dizer: …" + sugestões da tela |

Os sinônimos ficam em `src/modules/voice/model/commands.ts` e são fáceis de ampliar.

## Contratos

```ts
// src/modules/voice/index.ts
export { VoiceDock } from './components/VoiceDock';          // montado por src/app
export { WelcomeGate } from './components/WelcomeGate';      // primeira visita
export function useSpeech(): {
  speak(text: string): Promise<void>;
  stop(): void;
  speaking: boolean;
  provider: 'browser' | 'openai';
};
export function parseCommand(transcript: string, actions: ScreenAction[]): VoiceIntent; // puro, testável
```

O `voice` **não importa** `scanner` nem `rewards`. Ele só lê `useCurrentScreen()` do app-shell. Cabe a cada tela registrar uma fala útil:

| Tela | `speech` registrado (exemplo) |
|---|---|
| Home | "Bem-vindo ao EcoScan. Toque no botão verde para escanear um objeto, no azul para descartar, ou no amarelo para ver suas moedas." |
| Resultado | `spokenSummary` + (se composto) "Por que aqui? " + `categoryReason` |
| Carteira | "Você está no nível Broto, com 120 pontos de experiência e 35 moedas." |

## Estrutura do módulo

```
api/tts.ts                          → proxy TTS (OpenAI)
src/modules/voice/
  index.ts
  model/commands.ts                 → tabela de intenções e sinônimos
  model/parseCommand.ts             → normalização + matching (puro)
  tts/browserTts.ts                 → speechSynthesis + escolha de voz pt-BR
  tts/openaiTts.ts                  → cliente /api/tts + cache em memória
  tts/useSpeech.ts                  → escolhe o provedor (config + fallback)
  stt/useVoiceCommand.ts            → SpeechRecognition + detecção de suporte
  components/VoiceDock.tsx
  components/WelcomeGate.tsx
```

## Estilo de código

Segue a [SPEC-app-shell](SPEC-app-shell.md#estilo-de-código). As funções de parsing e de escolha de voz são **puras** e recebem as dependências por parâmetro (ex.: a lista de vozes), para poderem ser testadas sem navegador.

```ts
export function pickPtBrVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ptBr = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-br');
  return ptBr.find((v) => v.localService) ?? ptBr[0] ?? null;
}
```

## Estratégia de testes

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest (table-driven) | `parseCommand`: cada sinônimo, acentos/maiúsculas, ações da tela, frase desconhecida; `pickPtBrVoice`; normalização |
| Unitário | Vitest + fakes | `useSpeech`: usa o browser quando há voz pt-BR e cai para openai quando não há; o cache evita uma segunda chamada |
| Handler | Vitest + OpenAI mockado | `/api/tts`: 400 para texto vazio ou > 600 caracteres, 403 para origem inválida, retorno `audio/mpeg` |
| Componente | Testing Library | O 🎤 some sem suporte; o 🔊 lê o `speech` da tela; o Modo voz persiste |
| E2E | Playwright com `speechSynthesis` e `SpeechRecognition` falsos (injetados via `addInitScript`) | Comando "escanear" na home → `/escanear`; "repetir" no resultado → fala o `spokenSummary` |
| Manual | Celulares reais | Android/Chrome e iOS/Safari: qualidade da voz, reconhecimento no barulho de sala de aula |

## Limites

- **Sempre:** ativar o microfone só após um toque no 🎤; mostrar um indicador visual enquanto escuta; manter todos os fluxos funcionando sem voz (a voz é uma camada a mais, nunca obrigatória); testar em pelo menos um Android e um iPhone reais.
- **Perguntar antes:** trocar o reconhecimento do navegador pela transcrição da OpenAI; ligar o Modo voz por padrão também para quem já passou da tela de boas-vindas; adicionar novas intenções que executam ações irreversíveis.
- **Nunca:** gravar ou guardar áudio do usuário; escutar continuamente em segundo plano; usar o TTS da OpenAI para textos que não vêm do app (o endpoint não é um TTS genérico).

## Privacidade

O reconhecimento de voz do Chrome (Android e desktop) **envia o áudio para servidores do Google** para fazer a transcrição. O Safari pode fazer o mesmo com servidores da Apple. O EcoScan não grava nem guarda nada, mas a tela de boas-vindas e a página "Sobre" avisam: *"Quando você toca no microfone, o navegador envia sua fala para ser transformada em texto."*

## Critérios de sucesso

- [ ] Um usuário consegue **escanear um item, ouvir o resultado, ir até o descarte e ouvir o saldo** usando só os botões 🔊/🎤 e comandos de voz (roteiro E2E + teste manual).
- [ ] `parseCommand` reconhece 100% dos sinônimos da tabela, com e sem acento.
- [ ] Sem voz pt-BR no aparelho → a reserva via OpenAI entra sozinha; "repetir" logo em seguida não faz uma nova chamada à API.
- [ ] No Firefox (sem reconhecimento), o 🎤 não aparece e nenhum erro surge no console.
- [ ] Do toque no 🔊 até o início da fala: ≤ 300 ms no browser e ≤ 2 s pela OpenAI.
- [ ] Todos os testes passam; `lint` e `typecheck` limpos.

## Perguntas em aberto

- Nenhuma no momento. O aviso de privacidade do reconhecimento de voz entra no texto de boas-vindas; confirme se esse aviso basta para a escola.
