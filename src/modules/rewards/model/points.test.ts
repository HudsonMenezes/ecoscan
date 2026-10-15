import { describe, expect, it } from 'vitest';
import { acceptsCategory, findPoint, type CollectionPoint } from './points';

describe('points', () => {
  it('o ponto de demonstração existe e aceita todas as categorias', () => {
    const point = findPoint('escola-demo');
    expect(point).toMatchObject({ id: 'escola-demo', accepts: 'all' });
    expect(acceptsCategory(point!, 'pilhas_baterias')).toBe(true);
    expect(acceptsCategory(point!, 'organico')).toBe(true);
  });

  it('ponto desconhecido → null', () => {
    expect(findPoint('nao-existe')).toBeNull();
  });

  it('nenhum ponto aceita "desconhecido", nem o que aceita tudo', () => {
    expect(acceptsCategory(findPoint('escola-demo')!, 'desconhecido')).toBe(false);
  });

  it('ponto com lista só aceita as categorias da lista', () => {
    const ecoponto: CollectionPoint = {
      id: 'ecoponto-teste',
      name: 'Ecoponto de teste',
      accepts: ['papel', 'plastico'],
    };
    expect(acceptsCategory(ecoponto, 'papel')).toBe(true);
    expect(acceptsCategory(ecoponto, 'vidro')).toBe(false);
  });
});
