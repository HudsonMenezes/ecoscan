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

export const ScanResultSchema = z.object({
  identified: z.boolean(),
  itemName: z.string().max(60), // "Pilha alcalina AA"
  material: z.string().max(60), // "Zinco, manganês, aço"
  category: CategorySchema,
  confidence: ConfidenceSchema,
  isComposite: z.boolean(), // item feito de vários materiais (ex.: longa vida)
  disposal: z.string().max(240), // como descartar, 1–2 frases
  categoryReason: z.string().max(240), // por que esse destino; detalhado se isComposite
  consequence: z.string().max(240), // o que acontece se descartar errado
  spokenSummary: z.string().max(280), // frase única e simples para o TTS
});
export type ScanResult = z.infer<typeof ScanResultSchema>;
