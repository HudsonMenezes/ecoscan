import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '@/shared/contracts';
import { CATEGORIES } from '@/modules/scanner';
import { REWARD_GROUPS, rewardFor } from './rewardRules';

describe('rewardRules', () => {
  it.each([
    ['pilhas_baterias', 20, 10],
    ['eletronicos', 20, 10],
    ['lampadas', 20, 10],
    ['medicamentos', 20, 10],
    ['oleo_cozinha', 20, 10],
    ['papel', 10, 5],
    ['plastico', 10, 5],
    ['metal', 10, 5],
    ['vidro', 10, 5],
    ['organico', 5, 2],
    ['rejeito', 5, 2],
  ] as const)('%s vale %i XP e %i moedas', (category, xp, coins) => {
    expect(rewardFor(category)).toEqual({ xp, coins });
  });

  it('"desconhecido" nunca gera recompensa', () => {
    expect(rewardFor('desconhecido')).toBeNull();
  });

  it('todas as categorias têm regra (exceto "desconhecido")', () => {
    for (const id of CATEGORY_IDS) {
      if (id === 'desconhecido') continue;
      expect(rewardFor(id)).not.toBeNull();
    }
  });

  it('o grupo "perigosos" bate com o catálogo do scanner', () => {
    for (const [id, group] of Object.entries(REWARD_GROUPS)) {
      expect(group === 'hazardous').toBe(CATEGORIES[id as keyof typeof CATEGORIES].hazardous);
    }
  });
});
