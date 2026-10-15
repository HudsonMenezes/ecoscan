// Níveis por XP acumulado. Mudar nomes ou valores: perguntar antes (SPEC-rewards).
// O ícone é um desenho em traço (LevelIcon), não emoji: identidade aprovada em 2026-10-15.
export type LevelIconName = 'seed' | 'sprout' | 'seedling' | 'tree' | 'forest' | 'planet';

export type Level = {
  number: number;
  name: string;
  icon: LevelIconName;
  minXp: number;
};

export const LEVELS: readonly Level[] = [
  { number: 1, name: 'Semente', icon: 'seed', minXp: 0 },
  { number: 2, name: 'Broto', icon: 'sprout', minXp: 50 },
  { number: 3, name: 'Muda', icon: 'seedling', minXp: 150 },
  { number: 4, name: 'Árvore', icon: 'tree', minXp: 300 },
  { number: 5, name: 'Floresta', icon: 'forest', minXp: 500 },
  { number: 6, name: 'Guardião do Planeta', icon: 'planet', minXp: 800 },
];

export function levelForXp(xp: number): Level {
  return LEVELS.findLast((level) => xp >= level.minXp) ?? LEVELS[0]!;
}

export function getNextLevel(level: Level): Level | null {
  return LEVELS.find((l) => l.number === level.number + 1) ?? null;
}

// Fração (0..1) do caminho entre o nível atual e o próximo; 1 no último nível.
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const next = getNextLevel(level);
  if (!next) return 1;
  const progress = (xp - level.minXp) / (next.minXp - level.minXp);
  return Math.min(1, Math.max(0, progress));
}
