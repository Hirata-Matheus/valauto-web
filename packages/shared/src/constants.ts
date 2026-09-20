/**
 * Constantes de dominio compartilhadas entre web, mobile e camada de API.
 *
 * Tipos de veiculo e categorias de avaliacao sao propositalmente "dados", nao
 * enums fechados no codigo: o banco guarda a lista real e estes valores sao o
 * conjunto inicial/semente. Adicionar moto, caminhao ou uma categoria nova
 * ("Capacidade off-road") nao exige mudanca estrutural.
 */

export const VEHICLE_TYPES = ['carro', 'moto', 'caminhao'] as const;

export type VehicleTypeSlug = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleTypeSlug, string> = {
  carro: 'Carro',
  moto: 'Moto',
  caminhao: 'Caminhão',
};

/** Categorias de avaliacao do MVP. Todas se aplicam a todos os tipos por ora. */
export const RATING_CATEGORY_SLUGS = [
  'desempenho',
  'conforto',
  'seguranca',
  'economia',
  'tecnologia',
] as const;

export type RatingCategorySlug = (typeof RATING_CATEGORY_SLUGS)[number];

export const RATING_CATEGORY_LABELS: Record<RatingCategorySlug, string> = {
  desempenho: 'Desempenho',
  conforto: 'Conforto',
  seguranca: 'Segurança',
  economia: 'Economia',
  tecnologia: 'Tecnologia',
};

/** Escala de notas: 1 a 5, com incremento de meia estrela. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;

/** Maximo de veiculos no comparador (Fase 2). */
export const MAX_COMPARISON_ITEMS = 3;

/** Paginacao do catalogo. */
export const PER_PAGE_OPTIONS = [12, 24, 48] as const;
export const DEFAULT_PER_PAGE = 12;

export const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Melhor avaliados' },
  { value: 'rating_asc', label: 'Pior avaliados' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'year_desc', label: 'Mais novos' },
  { value: 'year_asc', label: 'Mais antigos' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const REVIEW_COMMENT_MAX_LENGTH = 1000;
