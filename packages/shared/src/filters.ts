import { DEFAULT_PER_PAGE } from './constants';
import { vehicleFiltersSchema, type VehicleFilters } from './schemas';
import type { Paginated, Vehicle } from './types';

/** Le os filtros a partir da URL (objeto de search params ou URLSearchParams). */
export function parseVehicleFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): VehicleFilters {
  const raw: Record<string, string> = {};

  if (input instanceof URLSearchParams) {
    for (const [key, value] of input.entries()) raw[key] = value;
  } else {
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      raw[key] = Array.isArray(value) ? (value[0] ?? '') : value;
    }
  }

  return vehicleFiltersSchema.parse(raw);
}

/**
 * Serializa os filtros de volta para a URL, omitindo valores default — a URL
 * fica limpa e continua compartilhavel.
 */
export function serializeVehicleFilters(filters: Partial<VehicleFilters>): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  };

  set('q', filters.q);
  set('type', filters.type);
  set('brand', filters.brand);
  set('yearMin', filters.yearMin);
  set('yearMax', filters.yearMax);
  set('priceMin', filters.priceMin);
  set('priceMax', filters.priceMax);
  set('minRating', filters.minRating);
  if (filters.sort && filters.sort !== 'rating_desc') set('sort', filters.sort);
  if (filters.page && filters.page > 1) set('page', filters.page);
  if (filters.perPage && filters.perPage !== DEFAULT_PER_PAGE) set('perPage', filters.perPage);

  return params;
}

/** Quantos filtros (fora ordenacao/paginacao) estao ativos — usado no badge "limpar filtros". */
export function countActiveFilters(filters: Partial<VehicleFilters>): number {
  const keys: (keyof VehicleFilters)[] = [
    'q',
    'type',
    'brand',
    'yearMin',
    'yearMax',
    'priceMin',
    'priceMax',
    'minRating',
  ];
  return keys.filter((key) => {
    const value = filters[key];
    return value !== undefined && value !== null && value !== '';
  }).length;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Aplica filtros, ordenacao e paginacao em memoria.
 *
 * Usado pelo repositorio de desenvolvimento (sem Supabase) e pelos testes; o
 * repositorio Supabase traduz os mesmos filtros para SQL.
 */
export function applyVehicleFilters(
  vehicles: readonly Vehicle[],
  filters: VehicleFilters,
): Paginated<Vehicle> {
  const query = filters.q ? normalize(filters.q) : null;

  let result = vehicles.filter((vehicle) => {
    if (filters.type && vehicle.type !== filters.type) return false;
    if (filters.brand && normalize(vehicle.brand.slug) !== normalize(filters.brand)) return false;
    if (filters.yearMin !== undefined && vehicle.year < filters.yearMin) return false;
    if (filters.yearMax !== undefined && vehicle.year > filters.yearMax) return false;
    if (filters.priceMin !== undefined && vehicle.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && vehicle.price > filters.priceMax) return false;
    if (filters.minRating !== undefined && filters.minRating > 0) {
      const rating = vehicle.summary.overallAverage;
      if (rating === null || rating < filters.minRating) return false;
    }
    if (query) {
      const haystack = normalize(`${vehicle.brand.name} ${vehicle.model}`);
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  result = sortVehicles(result, filters.sort);

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.perPage));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.perPage;

  return {
    items: result.slice(start, start + filters.perPage),
    total,
    page,
    perPage: filters.perPage,
    totalPages,
  };
}

/** Ordena uma copia da lista. Veiculos sem nota ficam no fim ao ordenar por nota. */
export function sortVehicles(vehicles: readonly Vehicle[], sort: VehicleFilters['sort']): Vehicle[] {
  const copy = [...vehicles];

  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'year_asc':
      return copy.sort((a, b) => a.year - b.year);
    case 'year_desc':
      return copy.sort((a, b) => b.year - a.year);
    case 'rating_asc':
      return copy.sort(
        (a, b) =>
          (a.summary.overallAverage ?? Number.POSITIVE_INFINITY) -
          (b.summary.overallAverage ?? Number.POSITIVE_INFINITY),
      );
    case 'rating_desc':
    default:
      return copy.sort((a, b) => (b.summary.overallAverage ?? -1) - (a.summary.overallAverage ?? -1));
  }
}
