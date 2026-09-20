import type { RatingCategorySlug, VehicleTypeSlug } from './constants';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Preenchido quando o usuario confirma o e-mail. Null => nao pode publicar opiniao. */
  emailVerifiedAt: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
}

export interface VehicleType {
  slug: VehicleTypeSlug | string;
  label: string;
  /** Ordem de exibicao nas abas do catalogo. */
  position: number;
}

/**
 * Especificacoes tecnicas. Os campos variam por tipo de veiculo, entao o
 * contrato e aberto: chaves conhecidas tipadas + index signature para os
 * campos que cada tipo novo trouxer (ex.: payloadKg em caminhoes).
 */
export interface VehicleSpecs {
  /** Potencia em cv. */
  powerHp?: number;
  /** Consumo medio em km/l. */
  fuelConsumptionKmL?: number;
  /** Aceleracao 0-100 km/h em segundos. */
  acceleration0to100s?: number;
  seats?: number;
  trunkLiters?: number;
  /** Cilindrada em cm3 (motos). */
  engineCc?: number;
  weightKg?: number;
  /** Capacidade de carga em kg (caminhoes/caminhonetes). */
  payloadKg?: number;
  axles?: number;
  [key: string]: number | string | undefined;
}

/** Metadados de spec usados na renderizacao e, na Fase 2, no destaque do comparador. */
export interface SpecFieldMeta {
  key: keyof VehicleSpecs & string;
  label: string;
  unit: string;
  /** true => maior e melhor (potencia); false => menor e melhor (0-100 km/h). */
  higherIsBetter: boolean;
  /** Tipos aos quais o campo se aplica. Vazio => todos. */
  appliesTo: readonly (VehicleTypeSlug | string)[];
}

export interface Vehicle {
  id: string;
  slug: string;
  brand: Brand;
  model: string;
  type: VehicleTypeSlug | string;
  year: number;
  /** Preco em BRL. */
  price: number;
  shortDescription: string | null;
  description: string | null;
  images: string[];
  specs: VehicleSpecs;
  summary: VehicleRatingSummary;
  createdAt: string;
}

export interface RatingCategory {
  id: string;
  slug: RatingCategorySlug | string;
  name: string;
  description: string | null;
  /** Tipos de veiculo aos quais a categoria se aplica. Vazio => todos. */
  appliesTo: readonly (VehicleTypeSlug | string)[];
  position: number;
}

export type ReviewStatus = 'published' | 'pending' | 'reported' | 'removed';

/** Nota de uma categoria dentro de uma review. */
export interface ReviewRating {
  categoryId: string;
  categorySlug: string;
  score: number;
}

export interface Review {
  id: string;
  vehicleId: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  ratings: ReviewRating[];
  /** Media das categorias desta review. */
  overall: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

/** Agregado recalculado a cada review publicada/editada/removida. */
export interface VehicleRatingSummary {
  vehicleId: string;
  /** slug da categoria -> media (null quando ainda nao ha notas). */
  categoryAverages: Record<string, number | null>;
  overallAverage: number | null;
  reviewCount: number;
  updatedAt?: string;
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  userId: string;
  brandName: string;
  model: string;
  type: VehicleTypeSlug | string;
  year: number | null;
  notes: string | null;
  status: SuggestionStatus;
  createdAt: string;
}

/** Resposta paginada do catalogo. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
