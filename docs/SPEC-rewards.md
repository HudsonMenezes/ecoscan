# Spec: rewards

> Módulo 4 de 4. Depende de [`app-shell`](SPEC-app-shell.md) e [`scanner`](SPEC-scanner.md). Veja [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Status: **aprovada em 2026-10-15**.

## Objetivo

Recompensar o descarte correto. O usuário escaneia o item, vai até o ponto de coleta, lê o **QR code** e ganha **XP** (que sobe o nível) e **moedas** (o saldo). Na v1 existe **um único QR de demonstração**, e as moedas ainda não podem ser trocadas por nada. O código fica preparado para vários pontos e para um catálogo de benefícios.

**Histórias de usuário:**

- Como usuário, depois de escanear uma garrafa PET, toco em **Descartar**, aponto a câmera para o QR do ponto de coleta e vejo/ouço: _"Parabéns! Você ganhou 10 XP e 5 moedas."_
- Como usuário, também posso ler o QR com a **câmera normal do celular**: ele abre o EcoScan já validando o descarte.
- Como usuário, abro **Minha carteira** e vejo meu nível (com ícone), a barra de XP até o próximo nível, minhas moedas e o histórico do que descartei.
- Como usuário que tentou ler o QR sem ter escaneado nada, o app me explica que primeiro preciso escanear o item.

## Fluxo de descarte

```
/descartar  (ou abrir a URL do QR pela câmera nativa: /descartar?ponto=escola-demo)
  ├─ sem ?ponto → leitor de QR (câmera)
  ├─ QR lido → extrai o pointId da URL
  └─ claimDisposal(pointId, now)
       ├─ ponto desconhecido          → "Esse QR não é um ponto do EcoScan"
       ├─ sem LastScan                → "Primeiro escaneie o item" + botão → /escanear
       ├─ LastScan com mais de 10 min → "Escaneie o item de novo antes de descartar"
       ├─ este scan (LastScan.id) já foi recompensado → "Esse item já foi contado! Escaneie o próximo item para descartar de novo." + botão "Escanear próximo"
       ├─ ponto não aceita a categoria → "Esse ponto não recebe <categoria>" (v1: aceita todas)
       └─ OK → registra no ledger → tela de comemoração (animação + som + fala)
```

## QR code de demonstração

- **Conteúdo:** uma URL, `https://<domínio-de-produção>/descartar?ponto=escola-demo`. Ser URL faz o QR funcionar tanto no leitor do app quanto na câmera nativa.
- **Geração:** o script `npm run qr:demo` lê `QR_BASE_URL` (padrão: a URL de produção na Vercel) e gera:
  - `print/qr-escola-demo.svg` e `.png` (1024px);
  - `print/qr-escola-demo.html`: uma página A4 para imprimir, com o QR grande, o logo, o texto "Ponto de coleta EcoScan" e ícones das categorias.
- O PNG final também fica commitado, para quem precisar só imprimir.

## Pontos de coleta

```ts
// src/modules/rewards/model/points.ts
export const COLLECTION_POINTS: CollectionPoint[] = [
  { id: 'escola-demo', name: 'Ponto de coleta da escola', accepts: 'all' },
];
// futuro: { id: 'ecoponto-centro', name: '...', accepts: ['papel', 'plastico', 'metal', 'vidro'] }
```

Na v1 o ponto aceita todas as categorias, exceto `desconhecido`, que nunca gera recompensa. A checagem de `accepts` já existe e é testada, então novos pontos só exigem adicionar dados.

## Regras de recompensa

Ficam configuráveis em `model/rewardRules.ts`. Itens perigosos valem mais, porque descartá-los certo dá mais trabalho e tem mais impacto:

| Grupo       | Categorias                                                                   | XP  | Moedas |
| ----------- | ---------------------------------------------------------------------------- | --- | ------ |
| Perigosos   | `pilhas_baterias`, `eletronicos`, `lampadas`, `medicamentos`, `oleo_cozinha` | 20  | 10     |
| Recicláveis | `papel`, `plastico`, `metal`, `vidro`                                        | 10  | 5      |
| Outros      | `organico`, `rejeito`                                                        | 5   | 2      |

### Níveis

| Nível | Nome                | Ícone | XP mínimo |
| ----- | ------------------- | ----- | --------- |
| 1     | Semente             | 🌰    | 0         |
| 2     | Broto               | 🌱    | 50        |
| 3     | Muda                | 🌿    | 150       |
| 4     | Árvore              | 🌳    | 300       |
| 5     | Floresta            | 🌲🌳  | 500       |
| 6     | Guardião do Planeta | 🌎    | 800       |

Os ícones da tabela são de referência: desde a identidade visual de 2026-10-15 o app desenha cada nível em traço (`LevelIcon`: semente, broto, muda, árvore, floresta, planeta), sem emoji.

Ao subir de nível aparece uma comemoração específica, com fala: _"Você subiu para o nível Muda!"_.

## Dados: ledger

O saldo **não fica salvo como um número solto**. Ele é calculado a partir de um **ledger** (lista que só recebe novas entradas), o que facilita migrar para o Supabase e incluir resgates no futuro.

```ts
// persistido via AppStorage em 'ecoscan:ledger'
type LedgerEntry = {
  id: string;                 // uuid
  type: 'earn';               // futuro: 'redeem'
  scanId: string;             // LastScan.id; impede recompensar o mesmo scan duas vezes
  pointId: string;
  category: Category;
  itemName: string;
  xp: number;
  coins: number;
  createdAt: string;          // ISO
};

// derivados (puros)
getWallet(ledger): { xp: number; coins: number; level: Level; nextLevel: Level | null; progress: number /* 0..1 */ };
```

## Contratos

```ts
// src/modules/rewards/index.ts
export function claimDisposal(input: {
  pointId: string;
  lastScan: LastScan | null;
  ledger: LedgerEntry[];
  now: Date; // relógio injetado, para os testes
}): ClaimResult; // { ok: true; entry; leveledUp: Level | null } | { ok: false; reason: ClaimError }

export type ClaimError =
  'unknown_point' | 'no_scan' | 'scan_expired' | 'already_claimed' | 'category_not_accepted';
```

`claimDisposal` é **pura**. O hook `useDisposal` lê o `LastScan` e o ledger, chama a função, persiste o resultado e registra a fala da tela via `useScreen`.

## Telas

| Rota                   | Conteúdo                                                                                          | `speech` (voice)                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/descartar`           | Leitor de QR em tela cheia, com moldura e instrução ilustrada                                     | "Aponte a câmera para o QR code do ponto de coleta."                                                                   |
| `/descartar` (sucesso) | Confete + moedas animadas, `+XP` e `+moedas`, botão "Escanear outro"                              | "Parabéns! Você descartou <item> corretamente e ganhou <xp> pontos e <moedas> moedas."                                 |
| `/descartar` (erro)    | Ícone + mensagem curta + uma ação (ex.: "Escanear item")                                          | A própria mensagem                                                                                                     |
| `/carteira`            | Nível com ícone, barra de XP, moedas, histórico (ícone/cor da categoria, item, +XP/+moedas, data) | "Você está no nível <nome>, com <xp> pontos de experiência e <moedas> moedas. Faltam <n> pontos para o próximo nível." |

## Estrutura do módulo

```
src/modules/rewards/
  index.ts
  model/points.ts
  model/rewardRules.ts
  model/levels.ts
  model/ledger.ts            → schemas Zod + getWallet (puro)
  model/claimDisposal.ts     → regras de validação (puro)
  qr/useQrReader.ts          → BarcodeDetector nativo; fallback jsQR
  qr/parsePointUrl.ts        → URL do QR → pointId (puro)
  hooks/useDisposal.ts
  components/DiscardScreen.tsx
  components/Celebration.tsx
  components/WalletScreen.tsx
scripts/generate-qr.ts       → npm run qr:demo (pacote `qrcode`)
print/                       → QR gerado e página A4 para imprimir
```

Dependências novas (aprovadas por esta spec): `jsQR` (leitura de QR onde não há `BarcodeDetector`, como no iOS) e `qrcode` (geração, só em dev).

## Estilo de código

Segue a [SPEC-app-shell](SPEC-app-shell.md#estilo-de-código). Toda regra de negócio fica em funções puras com o relógio injetado:

```ts
const SCAN_TTL_MS = 10 * 60 * 1000;

export function claimDisposal({ pointId, lastScan, ledger, now }: ClaimInput): ClaimResult {
  const point = findPoint(pointId);
  if (!point) return fail('unknown_point');
  if (!lastScan) return fail('no_scan');
  if (now.getTime() - Date.parse(lastScan.scannedAt) > SCAN_TTL_MS) return fail('scan_expired');
  if (ledger.some((e) => e.scanId === lastScan.id)) return fail('already_claimed');
  if (!acceptsCategory(point, lastScan.category)) return fail('category_not_accepted');

  const entry = buildEarnEntry(point, lastScan, now);
  return { ok: true, entry, leveledUp: detectLevelUp(ledger, entry) };
}
```

## Estratégia de testes

| Nível      | Ferramenta            | O que cobre                                                                                                                                                                                                   |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitário   | Vitest (table-driven) | `claimDisposal`: cada `ClaimError` e o caminho feliz; expiração exatamente em 10 min; `getWallet` e as fronteiras de nível (49/50, 799/800); `parsePointUrl` (URL válida, outro domínio, sem parâmetro, lixo) |
| Unitário   | Vitest                | Ledger inválido no storage → carteira vazia, sem crash                                                                                                                                                        |
| Componente | Testing Library       | Sucesso mostra +XP/+moedas; cada erro mostra a ação certa; a carteira renderiza o histórico                                                                                                                   |
| E2E        | Playwright            | `LastScan` semeado → abrir `/descartar?ponto=escola-demo` → comemoração → `/carteira` com saldo atualizado; repetir a URL → "já foi contado"; novo scan do mesmo material → recompensado de novo              |
| Manual     | Celular real          | Ler o QR impresso pelo leitor do app **e** pela câmera nativa (Android e iPhone)                                                                                                                              |

Meta: 100% de cobertura de linhas em `model/` e `qr/parsePointUrl.ts`.

## Limites

- **Sempre:** manter as regras de negócio puras e testadas; derivar o saldo do ledger; usar o relógio injetado; tratar ledger corrompido como vazio.
- **Perguntar antes:** mudar valores de XP, moedas ou níveis; adicionar pontos de coleta; criar resgate de benefícios; mover o ledger para o Supabase.
- **Nunca:** recompensar scans `desconhecido` ou repetidos; apagar entradas do ledger (correções viram novas entradas no futuro); apresentar as moedas como dinheiro ou como algo trocável enquanto não houver benefícios reais.

## Segurança (demo)

Com o ledger no localStorage, alguém com conhecimento técnico consegue editar o próprio saldo, e qualquer pessoa com o QR (ou uma foto dele) consegue "descartar" sem ir ao ponto. **Isso é aceito na v1 de demonstração.** As proteções básicas (scan recente, uma recompensa por scan) evitam o abuso casual. A proteção real exige ledger no servidor (Supabase) e QRs dinâmicos ou assinados, o que fica fora do escopo.

## Critérios de sucesso

- [ ] Fluxo completo no celular: escanear → Descartar → ler o QR impresso → comemoração com fala → carteira atualizada.
- [ ] O mesmo QR lido pela câmera nativa (Android e iPhone) abre o app e credita, se houver um scan válido.
- [ ] O mesmo scan nunca é recompensado duas vezes, mas **scans diferentes do mesmo material** (ex.: duas garrafas PET escaneadas em sequência) são **ambos** recompensados. Um scan com mais de 10 min é recusado com uma mensagem clara.
- [ ] Nível e barra de progresso corretos nas fronteiras da tabela (teste unitário).
- [ ] `npm run qr:demo` gera SVG, PNG e a página A4 com a URL de produção.
- [ ] Todos os testes passam; `lint` e `typecheck` limpos.

## Perguntas em aberto

- Nenhuma no momento.

## Decisões

- Valores de XP/moedas e níveis aprovados como estão (2026-10-15); podem mudar depois.
- Sem freio contra o mesmo item escaneado várias vezes (sem limite diário nem intervalo mínimo). Aceito na demo (2026-10-15).
