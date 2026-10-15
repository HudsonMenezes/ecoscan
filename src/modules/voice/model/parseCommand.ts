// Transforma a frase reconhecida numa intenção. Puro e sem IA: o resultado
// precisa ser previsível e sem custo (SPEC-voice).
import type { ScreenAction } from '@/shared/lib/screen';
import { ACTION_SYNONYMS, GLOBAL_COMMANDS, type NavTarget } from './commands';

export type VoiceIntent =
  | { type: 'nav'; target: NavTarget }
  | { type: 'repeat' }
  | { type: 'help' }
  | { type: 'action'; action: ScreenAction }
  | { type: 'unknown' };

// Minúsculas, sem acentos e sem pontuação, com espaços simples.
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Quantas palavras da frase casam, ou 0. Compara palavras inteiras, para
// "fotografia" não casar com "foto".
function matchLength(words: string[], phrase: string): number {
  const target = normalize(phrase).split(' ').filter(Boolean);
  if (target.length === 0 || target.length > words.length) return 0;
  for (let start = 0; start + target.length <= words.length; start++) {
    if (target.every((word, i) => words[start + i] === word)) return target.length;
  }
  return 0;
}

const longest = (words: string[], phrases: string[]) =>
  Math.max(0, ...phrases.map((phrase) => matchLength(words, phrase)));

// Vence a frase mais longa encontrada ("tentar de novo" > "de novo"). No empate,
// a ação da tela vence o comando global, porque é o que a tela atual oferece.
export function parseCommand(transcript: string, actions: ScreenAction[]): VoiceIntent {
  const words = normalize(transcript).split(' ').filter(Boolean);
  let best: { length: number; intent: VoiceIntent } = { length: 0, intent: { type: 'unknown' } };

  for (const action of actions) {
    const length = longest(words, [action.label, ...ACTION_SYNONYMS[action.id]]);
    if (length > best.length) best = { length, intent: { type: 'action', action } };
  }

  for (const command of GLOBAL_COMMANDS) {
    const length = longest(words, command.phrases);
    if (length <= best.length) continue;
    best = {
      length,
      intent:
        command.type === 'nav' ? { type: 'nav', target: command.target } : { type: command.type },
    };
  }

  return best.intent;
}
