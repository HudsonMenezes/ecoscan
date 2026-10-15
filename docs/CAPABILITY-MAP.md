# Capability Map: EcoScan (nome provisório)

> Aprovado em 2026-10-15. Os ids dos módulos são estáveis: não renomear durante a iniciativa.
> Este mapa é o índice das specs: cada módulo tem `docs/SPEC-<id>.md`.

## Contexto

Projeto para um hackathon escolar sobre reciclagem. É um site (PWA mobile-first) que:

1. Identifica um objeto por foto e explica como descartá-lo e o que acontece se o descarte for errado.
2. Funciona por voz, para quem não sabe ler ou escrever.
3. Gamifica o descarte: quem comprova o descarte (QR code no ponto de coleta) ganha XP e moedas.

## Módulos

| Id do módulo | Responsabilidade                                                                                                                                                                     | Depende de             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `app-shell`  | Base do PWA: rotas, layout acessível, acesso à câmera, interface `AppStorage` (localStorage hoje, Supabase no futuro), configuração e o proxy serverless                             | —                      |
| `scanner`    | Captura a foto, chama `gpt-5.4-mini` (visão + Structured Outputs) pelo proxy e devolve o resultado: item, material, categoria, modo de descarte e consequência do descarte incorreto | `app-shell`            |
| `voice`      | Lê o conteúdo em voz alta (Web Speech por padrão, `gpt-4o-mini-tts` como reserva) e aceita comandos de voz no navegador. Consome o `ScreenContext` do app-shell, sem importar telas  | `app-shell`            |
| `rewards`    | Lê o QR de demonstração (um único ponto) e, se houver scan recente, credita XP e moedas. Mostra nível, saldo e extrato                                                               | `app-shell`, `scanner` |

Ordem de construção: `app-shell` → `scanner` → `voice`, `rewards` (em paralelo)

> Revisão 2026-10-15: `voice` deixou de depender de `scanner`. As telas expõem a fala e as ações pelo `useScreen` (app-shell), e o `src/app/` (raiz de composição) monta o `VoiceDock`. A ordem de construção não muda.

## Fora do escopo da v1 (preparado, mas não implementado)

- Vários pontos de coleta com QRs distintos.
- Troca de moedas por benefícios reais.
- Contas, login e sincronização (Supabase).
- Antifraude além da regra "scan recente + 1 QR".
