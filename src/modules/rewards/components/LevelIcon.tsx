import { IconSvg } from '@/shared/ui/icons';
import type { LevelIconName } from '../model/levels';

// Desenhos em 24x24 que crescem com o nível: semente → broto → muda → árvore →
// floresta → planeta. Decorativos: o nome do nível fica no texto ao lado.
const PATHS: Record<LevelIconName, string[]> = {
  seed: ['M12 4c3.5 2.5 5.5 6 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 10 8.5 6.5 12 4z', 'M12 9v6'],
  sprout: ['M12 21v-8', 'M12 13c0-4-3-6-7-6 0 4 3 6 7 6z', 'M12 11c0-4 3-7 7-7 0 4-3 7-7 7z'],
  seedling: [
    'M12 21V9',
    'M12 9c0-3 2-5 5-5 0 3-2 5-5 5z',
    'M12 13c0-3-2-5-5-5 0 3 2 5 5 5z',
    'M12 17c0-2.5 2-4 4.5-4 0 2.5-2 4-4.5 4z',
  ],
  tree: ['M12 21v-6', 'M12 3a6 6 0 0 0-5.6 8.2A4 4 0 0 0 8 19h8a4 4 0 0 0 1.6-7.8A6 6 0 0 0 12 3z'],
  forest: [
    'M8 21v-4',
    'M16 21v-5',
    'M8 4l-4.5 7H6l-3 5h10l-3-5h2.5z',
    'M16 6l-4 6h2l-2.5 4h9L18 12h2z',
  ],
  planet: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M3.5 9.5h4l2 2.5-1.5 3 2 3.5',
    'M14 3.5l-.5 3 3 2.5 4 .5',
    'M15 20l.5-3.5 3-2',
  ],
};

export function LevelIcon({ icon, size = 32 }: { icon: LevelIconName; size?: number }) {
  return (
    <IconSvg size={size}>
      {PATHS[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </IconSvg>
  );
}
