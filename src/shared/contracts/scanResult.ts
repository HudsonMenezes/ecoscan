// Contrato do scanner, compartilhado entre o front e api/ (fonte única de verdade).
// api/ importa este arquivo por caminho relativo e sem o alias `@/`, então ele
// só pode importar pacotes (zod), nunca `@/...`.
import { z } from 'zod';

// A ordem segue a tabela da SPEC-scanner. Mudar a lista impacta o rewards: perguntar antes.
export const CATEGORY_IDS = [
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
] as const;

export const CategorySchema = z.enum(CATEGORY_IDS);
export type Category = z.infer<typeof CategorySchema>;

export const ConfidenceSchema = z.enum(['alta', 'media', 'baixa']);

// Texto para o aluno: só escrita latina (com acentos), números, pontuação e símbolos.
// O modelo às vezes mistura outra escrita (ex.: uma palavra em árabe); isso reprova
// a resposta e o servidor tenta de novo.
const LATIN_TEXT = /^[\p{Script=Latin}\p{M}\p{N}\p{P}\p{S}\p{Zs}]*$/u;
const NOT_LATIN_CHAR = /[^\p{Script=Latin}\p{M}\p{N}\p{P}\p{S}\p{Zs}]/u;

// Código Unicode do primeiro caractere fora da regra (ex.: "U+0645"), para diagnóstico
// nos logs sem expor o texto.
export function firstInvalidChar(value: string): string | null {
  const match = NOT_LATIN_CHAR.exec(value);
  return match ? `U+${match[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}` : null;
}
const text = (max: number) => z.string().max(max).regex(LATIN_TEXT);

export const ScanResultSchema = z.object({
  identified: z.boolean(),
  itemName: text(60), // "Pilha alcalina AA"
  material: text(60), // "Zinco, manganês, aço"
  category: CategorySchema,
  confidence: ConfidenceSchema,
  isComposite: z.boolean(), // item feito de vários materiais (ex.: longa vida)
  disposal: text(240), // como descartar, 1–2 frases
  categoryReason: text(360), // por que esse destino, explicado para leigos; cita os materiais se isComposite
  consequence: text(360), // o que acontece se descartar errado: dano concreto e por quanto tempo
  benefit: text(240), // o que se ganha descartando certo (reciclagem, quem se beneficia)
  spokenSummary: text(280), // frase única e simples para o TTS
});
export type ScanResult = z.infer<typeof ScanResultSchema>;
