// Catálogo local e fixo das categorias (padrão de cores da Resolução CONAMA 275/2001).
// A IA só escolhe o id; rótulo, cor, ícone e destino vêm daqui, para a interface
// ficar consistente e a IA nunca definir cores ou destinos.
import { CATEGORY_IDS, type Category } from '@/shared/contracts';

export type CategoryIcon =
  | 'paper'
  | 'plastic'
  | 'metal'
  | 'glass'
  | 'organic'
  | 'trash'
  | 'battery'
  | 'electronics'
  | 'lamp'
  | 'medicine'
  | 'oil'
  | 'unknown';

export type CategoryInfo = {
  id: Category;
  label: string;
  // Cor de fundo (tom CONAMA ajustado para contraste AA) e cor do texto sobre ela.
  color: string;
  textColor: string;
  conamaColor: string; // nome da cor, para quem não distingue cores e para a fala
  icon: CategoryIcon;
  destination: string;
  // Título do bloco que explica o destino, para leigos (ex.: "Por que na lixeira azul?").
  whyTitle: string;
  hazardous: boolean; // perigoso: nunca pode ir para o lixo comum nem para a reciclável comum
};

const DARK = '#1a1a1a';
const LIGHT = '#ffffff';
const ORANGE = { color: '#ef6c00', textColor: DARK, conamaColor: 'laranja' };

export const CATEGORIES: Record<Category, CategoryInfo> = {
  papel: {
    id: 'papel',
    label: 'Papel e papelão',
    color: '#1f5fae',
    textColor: LIGHT,
    conamaColor: 'azul',
    icon: 'paper',
    destination: 'Coleta seletiva',
    whyTitle: 'Por que na lixeira azul?',
    hazardous: false,
  },
  plastico: {
    id: 'plastico',
    label: 'Plástico',
    color: '#c62828',
    textColor: LIGHT,
    conamaColor: 'vermelho',
    icon: 'plastic',
    destination: 'Coleta seletiva',
    whyTitle: 'Por que na lixeira vermelha?',
    hazardous: false,
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    color: '#f2b01e',
    textColor: DARK,
    conamaColor: 'amarelo',
    icon: 'metal',
    destination: 'Coleta seletiva',
    whyTitle: 'Por que na lixeira amarela?',
    hazardous: false,
  },
  vidro: {
    id: 'vidro',
    label: 'Vidro',
    color: '#1b7f3b',
    textColor: LIGHT,
    conamaColor: 'verde',
    icon: 'glass',
    destination: 'Coleta seletiva',
    whyTitle: 'Por que na lixeira verde?',
    hazardous: false,
  },
  organico: {
    id: 'organico',
    label: 'Orgânico',
    color: '#6d4c41',
    textColor: LIGHT,
    conamaColor: 'marrom',
    icon: 'organic',
    destination: 'Compostagem ou lixo orgânico',
    whyTitle: 'Por que na lixeira marrom?',
    hazardous: false,
  },
  rejeito: {
    id: 'rejeito',
    label: 'Não reciclável',
    color: '#616161',
    textColor: LIGHT,
    conamaColor: 'cinza',
    icon: 'trash',
    destination: 'Lixo comum',
    whyTitle: 'Por que no lixo comum?',
    hazardous: false,
  },
  pilhas_baterias: {
    id: 'pilhas_baterias',
    label: 'Pilhas e baterias',
    ...ORANGE,
    icon: 'battery',
    destination: 'Ponto de coleta específico',
    whyTitle: 'Por que no ponto de coleta de pilhas?',
    hazardous: true,
  },
  eletronicos: {
    id: 'eletronicos',
    label: 'Eletrônicos',
    ...ORANGE,
    icon: 'electronics',
    destination: 'Ponto de coleta de eletroeletrônicos',
    whyTitle: 'Por que no ponto de coleta de eletrônicos?',
    hazardous: true,
  },
  lampadas: {
    id: 'lampadas',
    label: 'Lâmpadas',
    ...ORANGE,
    icon: 'lamp',
    destination: 'Ponto de coleta específico',
    whyTitle: 'Por que no ponto de coleta de lâmpadas?',
    hazardous: true,
  },
  medicamentos: {
    id: 'medicamentos',
    label: 'Medicamentos',
    ...ORANGE,
    icon: 'medicine',
    destination: 'Farmácias coletoras',
    whyTitle: 'Por que na farmácia?',
    hazardous: true,
  },
  oleo_cozinha: {
    id: 'oleo_cozinha',
    label: 'Óleo de cozinha',
    ...ORANGE,
    icon: 'oil',
    destination: 'Ponto de coleta de óleo',
    whyTitle: 'Por que no ponto de coleta de óleo?',
    hazardous: true,
  },
  desconhecido: {
    id: 'desconhecido',
    label: 'Não identificado',
    color: '#e0e0e0',
    textColor: DARK,
    conamaColor: 'nenhuma',
    icon: 'unknown',
    destination: 'Nenhum: tire outra foto',
    whyTitle: 'Por que tirar outra foto?',
    hazardous: false,
  },
};

// Mesma ordem da tabela da spec, para listas e legendas.
export const CATEGORY_LIST: CategoryInfo[] = CATEGORY_IDS.map((id) => CATEGORIES[id]);
