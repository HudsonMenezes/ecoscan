import { describe, expect, it } from 'vitest';
import { LEVELS, getNextLevel, levelForXp, levelProgress } from './levels';

describe('levels', () => {
  it('segue a tabela da spec, em ordem crescente de XP', () => {
    expect(LEVELS.map((l) => [l.number, l.name, l.icon, l.minXp])).toEqual([
      [1, 'Semente', 'seed', 0],
      [2, 'Broto', 'sprout', 50],
      [3, 'Muda', 'seedling', 150],
      [4, 'Árvore', 'tree', 300],
      [5, 'Floresta', 'forest', 500],
      [6, 'Guardião do Planeta', 'planet', 800],
    ]);
  });

  it.each([
    [0, 'Semente'],
    [49, 'Semente'],
    [50, 'Broto'],
    [149, 'Broto'],
    [150, 'Muda'],
    [299, 'Muda'],
    [300, 'Árvore'],
    [499, 'Árvore'],
    [500, 'Floresta'],
    [799, 'Floresta'],
    [800, 'Guardião do Planeta'],
    [10_000, 'Guardião do Planeta'],
  ])('%i XP → %s', (xp, name) => {
    expect(levelForXp(xp).name).toBe(name);
  });

  it('XP negativo (não deveria existir) fica no primeiro nível', () => {
    expect(levelForXp(-5).name).toBe('Semente');
  });

  it('próximo nível: o seguinte da tabela, ou null no último', () => {
    expect(getNextLevel(LEVELS[0]!)?.name).toBe('Broto');
    expect(getNextLevel(LEVELS[4]!)?.name).toBe('Guardião do Planeta');
    expect(getNextLevel(LEVELS[5]!)).toBeNull();
  });

  it.each([
    [0, 0],
    [25, 0.5],
    [49, 0.98],
    [50, 0],
    [100, 0.5],
    [650, 0.5],
    [799, 299 / 300],
    [800, 1],
    [5000, 1],
  ])('progresso até o próximo nível com %i XP = %d', (xp, progress) => {
    expect(levelProgress(xp)).toBeCloseTo(progress);
  });
});
