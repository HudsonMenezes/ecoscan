import { IconSvg } from '@/shared/ui/icons';
import type { CategoryIcon as IconName } from '../model/categories';

// Desenhos simples em 24x24, decorativos: o rótulo da categoria fica no texto ao lado.
const PATHS: Record<IconName, string[]> = {
  paper: ['M6 3h9l3 3v15H6z', 'M9 10h6M9 14h6M9 18h4'],
  plastic: ['M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3z', 'M8 12h8'],
  metal: [
    'M6 5c0-1.1 2.7-2 6-2s6 .9 6 2v14c0 1.1-2.7 2-6 2s-6-.9-6-2z',
    'M6 5c0 1.1 2.7 2 6 2s6-.9 6-2',
  ],
  glass: ['M8 3h8v3H8z', 'M7 6h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z'],
  organic: ['M5 19c0-8 6-14 14-14 0 8-6 14-14 14z', 'M5 19l7-7'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 14h10l1-14'],
  battery: ['M7 6h10v15H7z', 'M10 3h4v3', 'M12 10v4M10 12h4'],
  electronics: [
    'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M11 18h2',
  ],
  lamp: [
    'M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
    'M9 18h6M10 21h4',
  ],
  medicine: ['M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z', 'M7 10l7 7'],
  oil: ['M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z'],
  unknown: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7',
    'M12 17h.01',
  ],
};

export function CategoryIcon({ icon, size = 40 }: { icon: IconName; size?: number }) {
  return (
    <IconSvg size={size}>
      {PATHS[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </IconSvg>
  );
}
