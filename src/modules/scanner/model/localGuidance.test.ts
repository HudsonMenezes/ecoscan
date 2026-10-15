import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '@/shared/contracts';
import { CATEGORIES } from './categories';
import { LOCAL_GUIDANCE, LOCALE, getLocalGuidance } from './localGuidance';

const entries = Object.entries(LOCAL_GUIDANCE);

describe('localGuidance', () => {
  it('a cidade fica numa constante', () => {
    expect(LOCALE).toEqual({ city: 'Duque de Caxias', state: 'RJ' });
  });

  it.each(entries)('%s: toda fonte tem URL https e data de verificação válida', (_, guidance) => {
    expect(guidance.sources.length).toBeGreaterThan(0);
    for (const source of guidance.sources) {
      expect(source.label).not.toBe('');
      expect(new URL(source.url).protocol).toBe('https:');
      expect(source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(source.verifiedAt))).toBe(false);
    }
    if (guidance.link) expect(new URL(guidance.link.url).protocol).toBe('https:');
  });

  it.each(entries)(
    '%s: o texto não traz endereço nem horário (a lista oficial é que muda)',
    (_, guidance) => {
      expect(guidance.text).not.toMatch(/\b(rua|av\.|avenida|rodovia)\b/i);
      expect(guidance.text).not.toMatch(/\d{1,2}h|\d{1,2}:\d{2}/);
    },
  );

  it('só usa categorias do catálogo e nunca orienta "desconhecido" ou lixo comum', () => {
    for (const id of Object.keys(LOCAL_GUIDANCE)) expect(CATEGORY_IDS).toContain(id);
    expect(getLocalGuidance('desconhecido')).toBeUndefined();
    expect(getLocalGuidance('rejeito')).toBeUndefined();
  });

  it('categoria sem fonte oficial verificada não tem entrada', () => {
    // Pilhas: o localizador oficial estava com certificado vencido em 2026-10-15.
    expect(getLocalGuidance('pilhas_baterias')).toBeUndefined();
    expect(getLocalGuidance('oleo_cozinha')).toBeUndefined();
  });

  it('recicláveis comuns apontam para o Ecoponto da prefeitura', () => {
    for (const id of ['papel', 'plastico', 'metal', 'vidro'] as const) {
      expect(CATEGORIES[id].hazardous).toBe(false);
      expect(getLocalGuidance(id)?.text).toMatch(/Ecoponto/);
    }
  });
});
