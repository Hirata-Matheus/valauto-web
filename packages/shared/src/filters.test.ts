import { describe, expect, it } from 'vitest';
import {
  applyVehicleFilters,
  countActiveFilters,
  parseVehicleFilters,
  serializeVehicleFilters,
} from './filters';
import { vehicleFiltersSchema } from './schemas';
import type { Vehicle } from './types';

function makeVehicle(overrides: Partial<Vehicle> & { id: string }): Vehicle {
  return {
    slug: overrides.id,
    brand: { id: 'b1', name: 'Toyota', slug: 'toyota', logoUrl: null, country: 'Japão' },
    model: 'Corolla',
    type: 'carro',
    year: 2024,
    price: 150_000,
    shortDescription: null,
    description: null,
    images: [],
    specs: {},
    summary: {
      vehicleId: overrides.id,
      categoryAverages: {},
      overallAverage: 4,
      reviewCount: 5,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const catalog: Vehicle[] = [
  makeVehicle({
    id: 'corolla',
    model: 'Corolla',
    year: 2024,
    price: 150_000,
    summary: {
      vehicleId: 'corolla',
      categoryAverages: {},
      overallAverage: 4.5,
      reviewCount: 12,
    },
  }),
  makeVehicle({
    id: 'onix',
    model: 'Onix',
    brand: { id: 'b2', name: 'Chevrolet', slug: 'chevrolet', logoUrl: null, country: 'EUA' },
    year: 2022,
    price: 90_000,
    summary: { vehicleId: 'onix', categoryAverages: {}, overallAverage: 3.8, reviewCount: 30 },
  }),
  makeVehicle({
    id: 'xre300',
    model: 'XRE 300',
    type: 'moto',
    brand: { id: 'b3', name: 'Honda', slug: 'honda', logoUrl: null, country: 'Japão' },
    year: 2023,
    price: 28_000,
    summary: { vehicleId: 'xre300', categoryAverages: {}, overallAverage: null, reviewCount: 0 },
  }),
];

describe('vehicleFiltersSchema', () => {
  it('aplica defaults de ordenacao e paginacao', () => {
    const filters = vehicleFiltersSchema.parse({});
    expect(filters.sort).toBe('rating_desc');
    expect(filters.page).toBe(1);
    expect(filters.perPage).toBe(12);
  });

  it('trata strings vazias da URL como filtro ausente', () => {
    const filters = vehicleFiltersSchema.parse({ priceMin: '', yearMax: '' });
    expect(filters.priceMin).toBeUndefined();
    expect(filters.yearMax).toBeUndefined();
  });

  it('cai para os defaults em vez de quebrar com valores invalidos', () => {
    const filters = vehicleFiltersSchema.parse({ page: 'abc', perPage: '999' });
    expect(filters.page).toBe(1);
    expect(filters.perPage).toBe(12);
  });
});

describe('parse/serialize', () => {
  it('faz round-trip preservando os filtros ativos', () => {
    const params = new URLSearchParams('q=corolla&type=carro&priceMax=200000&sort=price_asc&page=2');
    const filters = parseVehicleFilters(params);
    const serialized = serializeVehicleFilters(filters);
    expect(serialized.get('q')).toBe('corolla');
    expect(serialized.get('type')).toBe('carro');
    expect(serialized.get('priceMax')).toBe('200000');
    expect(serialized.get('sort')).toBe('price_asc');
    expect(serialized.get('page')).toBe('2');
  });

  it('omite valores default para manter a URL limpa', () => {
    const serialized = serializeVehicleFilters(vehicleFiltersSchema.parse({}));
    expect(serialized.toString()).toBe('');
  });

  it('conta apenas filtros de conteudo, nao ordenacao/paginacao', () => {
    const filters = parseVehicleFilters(new URLSearchParams('q=onix&type=carro&sort=price_asc&page=3'));
    expect(countActiveFilters(filters)).toBe(2);
  });
});

describe('applyVehicleFilters', () => {
  it('filtra por tipo', () => {
    const result = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ type: 'moto' }));
    expect(result.items.map((item) => item.id)).toEqual(['xre300']);
    expect(result.total).toBe(1);
  });

  it('busca por marca ou modelo ignorando acento e caixa', () => {
    const porModelo = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ q: 'COROLLA' }));
    expect(porModelo.items.map((item) => item.id)).toEqual(['corolla']);

    const porMarca = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ q: 'chevrolet' }));
    expect(porMarca.items.map((item) => item.id)).toEqual(['onix']);
  });

  it('filtra por faixa de preco e de ano', () => {
    const result = applyVehicleFilters(
      catalog,
      vehicleFiltersSchema.parse({ priceMin: '50000', priceMax: '120000', yearMin: '2022' }),
    );
    expect(result.items.map((item) => item.id)).toEqual(['onix']);
  });

  it('descarta veiculos sem nota quando ha nota minima', () => {
    const result = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ minRating: '4' }));
    expect(result.items.map((item) => item.id)).toEqual(['corolla']);
  });

  it('ordena por nota deixando os sem avaliacao no fim', () => {
    const result = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ sort: 'rating_desc' }));
    expect(result.items.map((item) => item.id)).toEqual(['corolla', 'onix', 'xre300']);
  });

  it('ordena por menor preco', () => {
    const result = applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ sort: 'price_asc' }));
    expect(result.items.map((item) => item.id)).toEqual(['xre300', 'onix', 'corolla']);
  });

  it('pagina e limita a pagina pedida ao total disponivel', () => {
    const filters = vehicleFiltersSchema.parse({ perPage: '12', page: '9' });
    const result = applyVehicleFilters(catalog, filters);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(3);
  });

  it('nao muta a lista original ao ordenar', () => {
    const original = [...catalog];
    applyVehicleFilters(catalog, vehicleFiltersSchema.parse({ sort: 'price_desc' }));
    expect(catalog).toEqual(original);
  });
});
