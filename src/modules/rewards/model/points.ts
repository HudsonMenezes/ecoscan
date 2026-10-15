// Pontos de coleta. Na v1 há só o QR de demonstração; novos pontos só exigem dados aqui
// (perguntar antes de adicionar, SPEC-rewards).
import type { Category } from '@/shared/contracts';

export type CollectionPoint = {
  id: string;
  name: string;
  accepts: 'all' | readonly Category[];
};

export const COLLECTION_POINTS: readonly CollectionPoint[] = [
  { id: 'escola-demo', name: 'Ponto de coleta da escola', accepts: 'all' },
  // futuro: { id: 'ecoponto-centro', name: '...', accepts: ['papel', 'plastico', 'metal', 'vidro'] }
];

export function findPoint(
  pointId: string,
  points: readonly CollectionPoint[] = COLLECTION_POINTS,
): CollectionPoint | null {
  return points.find((point) => point.id === pointId) ?? null;
}

// `desconhecido` nunca é aceito: não há o que descartar.
export function acceptsCategory(point: CollectionPoint, category: Category): boolean {
  if (category === 'desconhecido') return false;
  return point.accepts === 'all' || point.accepts.includes(category);
}
