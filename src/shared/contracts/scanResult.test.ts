import { describe, expect, it } from 'vitest';
import { applyConfidenceRules } from './applyConfidenceRules';
import { ScanResultSchema, type ScanResult } from './scanResult';

const battery: ScanResult = {
  identified: true,
  itemName: 'Pilha alcalina AA',
  material: 'Zinco, manganês, aço',
  category: 'pilhas_baterias',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Não jogue no lixo comum. Leve a um ponto de coleta de pilhas.',
  categoryReason: 'Pilhas têm metais pesados e precisam de coleta especial.',
  consequence: 'Libera metais pesados que contaminam o solo e a água.',
  spokenSummary: 'Isso é uma pilha. Leve a um ponto de coleta de pilhas.',
};

describe('ScanResultSchema', () => {
  it('aceita um resultado válido', () => {
    expect(ScanResultSchema.parse(battery)).toEqual(battery);
  });

  it.each([
    ['itemName', 60],
    ['material', 60],
    ['disposal', 240],
    ['categoryReason', 240],
    ['consequence', 240],
    ['spokenSummary', 280],
  ] as const)('rejeita %s acima de %i caracteres', (field, max) => {
    expect(ScanResultSchema.safeParse({ ...battery, [field]: 'a'.repeat(max) }).success).toBe(true);
    expect(ScanResultSchema.safeParse({ ...battery, [field]: 'a'.repeat(max + 1) }).success).toBe(
      false,
    );
  });

  it('rejeita categoria fora do catálogo e confiança inválida', () => {
    expect(ScanResultSchema.safeParse({ ...battery, category: 'lixo' }).success).toBe(false);
    expect(ScanResultSchema.safeParse({ ...battery, confidence: 'total' }).success).toBe(false);
  });

  it('rejeita campo faltando', () => {
    const withoutSummary: Partial<ScanResult> = { ...battery };
    delete withoutSummary.spokenSummary;
    expect(ScanResultSchema.safeParse(withoutSummary).success).toBe(false);
  });
});

describe('applyConfidenceRules', () => {
  it.each(['alta', 'media'] as const)('confiança %s mantém a categoria', (confidence) => {
    expect(applyConfidenceRules({ ...battery, confidence })).toEqual({ ...battery, confidence });
  });

  it('confiança baixa vira desconhecido', () => {
    expect(applyConfidenceRules({ ...battery, confidence: 'baixa' }).category).toBe('desconhecido');
  });

  it('objeto não identificado vira desconhecido, mesmo com confiança alta', () => {
    expect(applyConfidenceRules({ ...battery, identified: false }).category).toBe('desconhecido');
  });

  it('preserva os textos e não altera o objeto original', () => {
    const input = { ...battery, confidence: 'baixa' as const };
    const output = applyConfidenceRules(input);

    expect(output).toEqual({ ...input, category: 'desconhecido' });
    expect(input.category).toBe('pilhas_baterias');
  });
});
