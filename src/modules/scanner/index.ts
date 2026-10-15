// API pública do scanner. Outros módulos importam só daqui.
export type { Category, ScanResult } from '@/shared/contracts';
export { CATEGORIES, CATEGORY_LIST } from './model/categories';
export type { CategoryInfo } from './model/categories';
export { getLastScan } from './model/lastScan';
export type { LastScan } from './model/lastScan';
export { ScanScreen } from './components/ScanScreen';
export { CategoryIcon } from './components/CategoryIcon';
