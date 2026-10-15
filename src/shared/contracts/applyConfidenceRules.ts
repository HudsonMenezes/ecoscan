// Regras aplicadas no servidor depois da resposta da IA. Função pura, sem imports `@/`
// (ver scanResult.ts).
import type { ScanResult } from './scanResult.js';

// Na dúvida, o app pede outra foto em vez de chutar: confiança baixa ou objeto
// não identificado viram `desconhecido`, que leva à tela "tente de novo" e não
// gera recompensa.
export function applyConfidenceRules(result: ScanResult): ScanResult {
  if (result.identified && result.confidence !== 'baixa') return result;
  return { ...result, category: 'desconhecido' };
}
