import OpenAI from 'openai';
import { z } from 'zod';
import { ScanResultSchema } from '../../src/shared/contracts/index.js';
import { SCAN_SYSTEM_PROMPT, SCAN_USER_TEXT } from './prompts/scan.js';

type Env = Record<string, string | undefined>;

export const DEFAULT_MODEL = 'gpt-5.4-mini';
export const MAX_OUTPUT_TOKENS = 600;

// O modo strict dos Structured Outputs não aceita maxLength/minLength, e o `pattern`
// dele não garante as classes Unicode que usamos. Esses limites ficam no prompt e o
// Zod confere depois (resposta fora do formato → retry).
const STRICT_UNSUPPORTED = new Set(['$schema', 'maxLength', 'minLength', 'pattern']);
export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (STRICT_UNSUPPORTED.has(key)) continue;
      out[key] = strip(value);
    }
    if (out.type === 'object' && out.properties && typeof out.properties === 'object') {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties);
    }
    return out;
  };
  return strip(z.toJSONSchema(schema)) as Record<string, unknown>;
}

export const SCAN_JSON_SCHEMA = toStrictJsonSchema(ScanResultSchema);

// O que o handler precisa da IA: foto → texto JSON cru. Injetável nos testes.
export type ScanModel = (imageBase64: string, signal: AbortSignal) => Promise<string>;

// Resposta que não serve (recusa, cortada por limite de tokens, vazia).
export class InvalidModelOutputError extends Error {}

let client: OpenAI | null = null;

function getClient(env: Env) {
  // Retentativas e timeout ficam no handler, que conhece o orçamento de tempo.
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0 });
  return client;
}

export function createOpenAIScanModel(env: Env = process.env): ScanModel {
  return async (imageBase64, signal) => {
    const response = await getClient(env).responses.create(
      {
        model: env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions: SCAN_SYSTEM_PROMPT,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: SCAN_USER_TEXT },
              {
                type: 'input_image',
                image_url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'auto',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'scan_result',
            strict: true,
            schema: SCAN_JSON_SCHEMA,
          },
        },
        reasoning: { effort: 'none' }, // menor esforço do gpt-5.4-mini: prioriza latência
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: false, // a OpenAI não guarda a foto nem a resposta (LGPD)
      },
      { signal },
    );

    if (response.status === 'incomplete' || !response.output_text) {
      throw new InvalidModelOutputError(
        `resposta inutilizável (${response.incomplete_details?.reason ?? 'sem texto'})`,
      );
    }
    return response.output_text;
  };
}
