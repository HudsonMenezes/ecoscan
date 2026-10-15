// Orientação local, curada à mão (nunca gerada pela IA): onde descartar em Duque de Caxias.
// Só entram fontes oficiais (prefeitura, programas de logística reversa, legislação), cada
// uma com URL e data de verificação. Categoria sem fonte não tem entrada e o ResultCard
// mostra só a orientação genérica. Não guardamos endereços nem horários de lojas, porque
// mudam sem aviso: o texto aponta para a lista oficial, que se mantém atualizada.
import type { Category } from '@/shared/contracts';

export const LOCALE = { city: 'Duque de Caxias', state: 'RJ' } as const;

export type LocalSource = {
  label: string; // quem publica (ex.: "Prefeitura de Duque de Caxias")
  url: string;
  verifiedAt: string; // AAAA-MM-DD
};

export type LocalGuidance = {
  text: string;
  // Link principal para a pessoa achar o ponto (a lista oficial, quando existe).
  link?: { label: string; url: string };
  sources: LocalSource[];
};

const VERIFIED_AT = '2026-10-15';

// Notícia oficial da inauguração do primeiro Ecoponto (31/07/2025): recebe recicláveis
// (papel, plástico, vidro e sucata ferrosa), entulho, poda e lixo comum.
const ECOPONTO_SOURCE: LocalSource = {
  label: 'Prefeitura de Duque de Caxias',
  url: 'https://portal.duquedecaxias.rj.gov.br/noticia/duque-de-caxias-ganha-primeiro-ecoponto-e-avanca-na-sustentabilidade-6522',
  verifiedAt: VERIFIED_AT,
};

const ecoponto = (material: string): LocalGuidance => ({
  text: `A Prefeitura tem Ecopontos gratuitos, como o do Parque Vila Nova, no Centro. Eles recebem ${material} e outros recicláveis, que vão para uma cooperativa de catadores.`,
  sources: [ECOPONTO_SOURCE],
});

export const LOCAL_GUIDANCE: Partial<Record<Category, LocalGuidance>> = {
  papel: ecoponto('papel e papelão'),
  plastico: ecoponto('plástico'),
  vidro: ecoponto('vidro'),
  metal: ecoponto('sucata de metal'),
  eletronicos: {
    text: 'A Green Eletron, que organiza a reciclagem de eletrônicos no Brasil, tem pontos de entrega em Duque de Caxias, em lojas, no shopping e em cooperativas.',
    link: {
      label: 'Ver os pontos de entrega',
      url: 'https://greeneletron.org.br/onde-descartar/',
    },
    sources: [
      {
        label: 'Green Eletron (logística reversa de eletroeletrônicos)',
        url: 'https://greeneletron.org.br/onde-descartar/',
        verifiedAt: VERIFIED_AT,
      },
    ],
  },
  lampadas: {
    text: 'Lâmpadas fluorescentes (as que têm mercúrio) vão para os pontos da Reciclus. Em Duque de Caxias, há pontos em supermercados e papelarias.',
    link: {
      label: 'Ver os pontos de entrega',
      url: 'https://reciclus.org.br/lista-pontos-entrega/',
    },
    sources: [
      {
        label: 'Reciclus (logística reversa de lâmpadas)',
        url: 'https://reciclus.org.br/lista-pontos-entrega/',
        verifiedAt: VERIFIED_AT,
      },
    ],
  },
  medicamentos: {
    text: 'Pela lei federal, cidades com mais de 500 mil habitantes, como Duque de Caxias, devem ter farmácias com coletor de remédios vencidos. Pergunte na farmácia mais perto de você.',
    sources: [
      {
        label: 'Decreto federal nº 10.388/2020, art. 10',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10388.htm',
        verifiedAt: VERIFIED_AT,
      },
      {
        label: 'IBGE, Censo 2022: 808.161 habitantes',
        url: 'https://cidades.ibge.gov.br/brasil/rj/duque-de-caxias/panorama',
        verifiedAt: VERIFIED_AT,
      },
    ],
  },
};

export function getLocalGuidance(category: Category): LocalGuidance | undefined {
  return LOCAL_GUIDANCE[category];
}
