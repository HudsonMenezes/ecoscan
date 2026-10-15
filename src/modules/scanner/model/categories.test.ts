import { describe, expect, it } from 'vitest';
import { CategorySchema } from '@/shared/contracts';
import { CATEGORIES, CATEGORY_LIST } from './categories';

// Contraste WCAG 2.x entre duas cores hex.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

describe('catálogo de categorias', () => {
  it('bate com o enum da spec, na mesma ordem', () => {
    expect(CategorySchema.options).toEqual([
      'papel',
      'plastico',
      'metal',
      'vidro',
      'organico',
      'rejeito',
      'pilhas_baterias',
      'eletronicos',
      'lampadas',
      'medicamentos',
      'oleo_cozinha',
      'desconhecido',
    ]);
    expect(CATEGORY_LIST.map((category) => category.id)).toEqual(CategorySchema.options);
  });

  it('cada entrada usa a própria chave como id', () => {
    for (const [key, info] of Object.entries(CATEGORIES)) expect(info.id).toBe(key);
  });

  it.each(CATEGORY_LIST)('$id: texto sobre a cor passa no contraste AA (≥ 4.5)', (info) => {
    expect(contrast(info.color, info.textColor)).toBeGreaterThanOrEqual(4.5);
  });

  it('só as categorias de logística reversa são perigosas', () => {
    expect(CATEGORY_LIST.filter((c) => c.hazardous).map((c) => c.id)).toEqual([
      'pilhas_baterias',
      'eletronicos',
      'lampadas',
      'medicamentos',
      'oleo_cozinha',
    ]);
  });

  it('cores CONAMA da tabela da spec', () => {
    expect(Object.fromEntries(CATEGORY_LIST.map((c) => [c.id, c.conamaColor]))).toMatchObject({
      papel: 'azul',
      plastico: 'vermelho',
      metal: 'amarelo',
      vidro: 'verde',
      organico: 'marrom',
      rejeito: 'cinza',
      pilhas_baterias: 'laranja',
    });
  });

  it('ícones e cores distintos entre as categorias não perigosas', () => {
    const common = CATEGORY_LIST.filter((c) => !c.hazardous);
    expect(new Set(common.map((c) => c.icon)).size).toBe(common.length);
    expect(new Set(common.map((c) => c.color)).size).toBe(common.length);
  });
});
