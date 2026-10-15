// Tabela de comandos de voz (SPEC-voice). Para ampliar, acrescente frases aqui:
// a comparação ignora maiúsculas, acentos e pontuação.
import type { ScreenAction } from '@/shared/lib/screen';

export type NavTarget = 'home' | 'scan' | 'discard' | 'wallet';

export type GlobalCommand =
  | { key: `nav:${NavTarget}`; type: 'nav'; target: NavTarget; phrases: string[] }
  | { key: 'repeat' | 'help'; type: 'repeat' | 'help'; phrases: string[] };

export const NAV_PATHS: Record<NavTarget, string> = {
  home: '/',
  scan: '/escanear',
  discard: '/descartar',
  wallet: '/carteira',
};

const NAV_PHRASES: Record<NavTarget, string[]> = {
  home: ['início', 'menu', 'voltar', 'começo', 'tela inicial'],
  scan: ['escanear', 'tirar foto', 'foto', 'câmera', 'o que é isso'],
  discard: ['descartar', 'jogar fora', 'qr', 'ponto de coleta'],
  wallet: ['carteira', 'moedas', 'pontos', 'saldo', 'meu nível', 'minhas moedas'],
};

export const GLOBAL_COMMANDS: GlobalCommand[] = [
  ...(Object.keys(NAV_PHRASES) as NavTarget[]).map((target): GlobalCommand => ({
    key: `nav:${target}`,
    type: 'nav',
    target,
    phrases: NAV_PHRASES[target],
  })),
  { key: 'repeat', type: 'repeat', phrases: ['repetir', 'de novo', 'ouvir', 'fala de novo'] },
  { key: 'help', type: 'help', phrases: ['ajuda', 'o que eu posso falar', 'socorro'] },
];

// Frases extras de cada ação, além do rótulo que a tela registra. Quando a tela
// oferece uma ação equivalente a uma navegação (ex.: "Descartar no ponto" no
// resultado), as frases da navegação também disparam a ação, porque ela pode
// fazer mais do que só trocar de rota.
export const ACTION_SYNONYMS: Record<ScreenAction['id'], string[]> = {
  capture: ['capturar', 'tirar agora', 'tirar foto', 'foto', 'bater foto'],
  retry: ['tentar de novo', 'tentar novamente', 'tentar outra vez'],
  discard: NAV_PHRASES.discard,
  'scan-again': [...NAV_PHRASES.scan, 'escanear outro', 'outra foto'],
  wallet: NAV_PHRASES.wallet,
};
