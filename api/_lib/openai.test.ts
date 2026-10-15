// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from '../../src/shared/contracts/index.js';
import { SCAN_JSON_SCHEMA } from './openai.js';

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  enum?: string[];
};

describe('SCAN_JSON_SCHEMA (Structured Outputs strict)', () => {
  const schema = SCAN_JSON_SCHEMA as JsonSchema;

  it('raiz é objeto, sem campos extras e com todos os campos obrigatórios', () => {
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required?.sort()).toEqual(Object.keys(schema.properties!).sort());
  });

  it('não usa palavras-chave que o modo strict rejeita', () => {
    const text = JSON.stringify(schema);
    expect(text).not.toContain('maxLength');
    expect(text).not.toContain('minLength');
    expect(text).not.toContain('$schema');
    expect(text).not.toContain('pattern');
  });

  it('a categoria é o enum do catálogo', () => {
    expect(schema.properties?.category?.enum).toEqual([...CATEGORY_IDS]);
  });
});
