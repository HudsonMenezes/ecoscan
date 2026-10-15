import { describe, expect, it } from 'vitest';
import { strings } from './strings';

describe('strings.disposal.success', () => {
  it.each([
    ['Garrafa PET', 'Você descartou garrafa PET corretamente.'],
    ['PET', 'Você descartou PET corretamente.'],
    ['Óleo de cozinha', 'Você descartou óleo de cozinha corretamente.'],
    ['lata', 'Você descartou lata corretamente.'],
  ])('nome do item no meio da frase: %s', (item, sentence) => {
    expect(strings.disposal.success.item(item)).toBe(sentence);
  });
});
