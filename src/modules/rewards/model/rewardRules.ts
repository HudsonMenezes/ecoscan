// Quanto cada descarte vale. Perigosos valem mais: dão mais trabalho e têm mais impacto.
// Mudar valores: perguntar antes (SPEC-rewards).
import type { Category } from '@/shared/contracts';

export type Reward = { xp: number; coins: number };
export type RewardGroup = 'hazardous' | 'recyclable' | 'other';

export const REWARD_RULES: Record<RewardGroup, Reward> = {
  hazardous: { xp: 20, coins: 10 },
  recyclable: { xp: 10, coins: 5 },
  other: { xp: 5, coins: 2 },
};

// `desconhecido` fica de fora de propósito: nunca gera recompensa.
export const REWARD_GROUPS: Record<Exclude<Category, 'desconhecido'>, RewardGroup> = {
  pilhas_baterias: 'hazardous',
  eletronicos: 'hazardous',
  lampadas: 'hazardous',
  medicamentos: 'hazardous',
  oleo_cozinha: 'hazardous',
  papel: 'recyclable',
  plastico: 'recyclable',
  metal: 'recyclable',
  vidro: 'recyclable',
  organico: 'other',
  rejeito: 'other',
};

export function rewardFor(category: Category): Reward | null {
  if (category === 'desconhecido') return null;
  return REWARD_RULES[REWARD_GROUPS[category]];
}
