import { describe, expect, it } from 'vitest';
import { PRODUCTION_ORIGIN, parsePointUrl } from './parsePointUrl';

const ALLOWED = ['http://localhost:4173', PRODUCTION_ORIGIN];

describe('parsePointUrl', () => {
  it.each([
    ['URL de produção', 'https://ecoscan-v1.vercel.app/descartar?ponto=escola-demo'],
    ['origem atual do app', 'http://localhost:4173/descartar?ponto=escola-demo'],
    ['com barra no fim', 'https://ecoscan-v1.vercel.app/descartar/?ponto=escola-demo'],
    [
      'com espaços e outros parâmetros',
      '  https://ecoscan-v1.vercel.app/descartar?x=1&ponto=escola-demo \n',
    ],
  ])('%s → pointId', (_, text) => {
    expect(parsePointUrl(text, ALLOWED)).toBe('escola-demo');
  });

  it('devolve um id que ainda não existe (quem decide se o ponto existe é o claimDisposal)', () => {
    expect(parsePointUrl(`${PRODUCTION_ORIGIN}/descartar?ponto=ecoponto-centro`, ALLOWED)).toBe(
      'ecoponto-centro',
    );
  });

  it.each([
    ['outro domínio', 'https://exemplo.com/descartar?ponto=escola-demo'],
    ['domínio parecido', 'https://ecoscan-v1.vercel.app.golpe.com/descartar?ponto=escola-demo'],
    [
      'http em vez de https na produção',
      'http://ecoscan-v1.vercel.app/descartar?ponto=escola-demo',
    ],
    ['outra rota', 'https://ecoscan-v1.vercel.app/escanear?ponto=escola-demo'],
    ['sem o parâmetro', 'https://ecoscan-v1.vercel.app/descartar'],
    ['parâmetro vazio', 'https://ecoscan-v1.vercel.app/descartar?ponto='],
    ['id com caracteres estranhos', 'https://ecoscan-v1.vercel.app/descartar?ponto=<script>'],
    ['id longo demais', `https://ecoscan-v1.vercel.app/descartar?ponto=${'a'.repeat(41)}`],
    ['texto que não é URL', 'escola-demo'],
    ['vazio', ''],
    ['javascript:', 'javascript:alert(1)'],
  ])('%s → null', (_, text) => {
    expect(parsePointUrl(text, ALLOWED)).toBeNull();
  });
});
