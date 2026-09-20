import { describe, expect, it } from 'vitest';
import {
  average,
  categoryWinners,
  formatRating,
  isValidRatingValue,
  rankVehicles,
  recommendVehicle,
  reviewOverall,
  roundToHalf,
  scoreVehicle,
  starBreakdown,
  summarizeVehicleReviews,
  weightedAverage,
} from './rating';
import type { Review, Vehicle, VehicleRatingSummary } from './types';

function makeReview(
  id: string,
  scores: Record<string, number>,
  status: Review['status'] = 'published',
): Review {
  const ratings = Object.entries(scores).map(([categorySlug, score]) => ({
    categoryId: `cat-${categorySlug}`,
    categorySlug,
    score,
  }));
  return {
    id,
    vehicleId: 'v1',
    author: { id: `u-${id}`, name: `User ${id}`, avatarUrl: null },
    ratings,
    overall: reviewOverall({ ratings }) ?? 0,
    comment: null,
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeVehicle(id: string, summary: Partial<VehicleRatingSummary>, price = 100_000): Vehicle {
  return {
    id,
    slug: id,
    brand: { id: `b-${id}`, name: `Marca ${id}`, slug: `marca-${id}`, logoUrl: null, country: null },
    model: `Modelo ${id}`,
    type: 'carro',
    year: 2024,
    price,
    shortDescription: null,
    description: null,
    images: [],
    specs: {},
    summary: {
      vehicleId: id,
      categoryAverages: {},
      overallAverage: null,
      reviewCount: 0,
      ...summary,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('roundToHalf', () => {
  it('arredonda para a meia estrela mais proxima', () => {
    expect(roundToHalf(4.2)).toBe(4);
    expect(roundToHalf(4.3)).toBe(4.5);
    expect(roundToHalf(4.74)).toBe(4.5);
    expect(roundToHalf(4.76)).toBe(5);
  });
});

describe('isValidRatingValue', () => {
  it('aceita apenas multiplos de 0,5 dentro de [1, 5]', () => {
    expect(isValidRatingValue(1)).toBe(true);
    expect(isValidRatingValue(3.5)).toBe(true);
    expect(isValidRatingValue(5)).toBe(true);
    expect(isValidRatingValue(0.5)).toBe(false);
    expect(isValidRatingValue(5.5)).toBe(false);
    expect(isValidRatingValue(3.2)).toBe(false);
    expect(isValidRatingValue(Number.NaN)).toBe(false);
  });
});

describe('average / weightedAverage', () => {
  it('retorna null para lista vazia em vez de zero', () => {
    expect(average([])).toBeNull();
    expect(weightedAverage([])).toBeNull();
  });

  it('calcula media simples', () => {
    expect(average([4, 5, 3])).toBe(4);
  });

  it('respeita os pesos informados', () => {
    expect(weightedAverage([{ value: 5, weight: 3 }, { value: 1, weight: 1 }])).toBe(4);
  });

  it('cai para media simples quando todos os pesos sao zero', () => {
    expect(weightedAverage([{ value: 4, weight: 0 }, { value: 2, weight: 0 }])).toBe(3);
  });
});

describe('summarizeVehicleReviews', () => {
  it('ignora reviews nao publicadas', () => {
    const summary = summarizeVehicleReviews('v1', [
      makeReview('r1', { desempenho: 5, conforto: 5 }),
      makeReview('r2', { desempenho: 1, conforto: 1 }, 'pending'),
      makeReview('r3', { desempenho: 1, conforto: 1 }, 'removed'),
    ]);
    expect(summary.reviewCount).toBe(1);
    expect(summary.categoryAverages.desempenho).toBe(5);
    expect(summary.overallAverage).toBe(5);
  });

  it('calcula media por categoria considerando so quem pontuou a categoria', () => {
    const summary = summarizeVehicleReviews('v1', [
      makeReview('r1', { desempenho: 5, economia: 3 }),
      makeReview('r2', { desempenho: 4 }),
    ]);
    expect(summary.categoryAverages.desempenho).toBe(4.5);
    expect(summary.categoryAverages.economia).toBe(3);
    expect(summary.reviewCount).toBe(2);
  });

  it('nao deixa uma categoria com mais notas dominar a media geral', () => {
    // desempenho tem 2 notas (media 5), economia tem 1 nota (2). Media das
    // medias = 3.5, enquanto a media crua das 3 notas seria 4.
    const summary = summarizeVehicleReviews('v1', [
      makeReview('r1', { desempenho: 5, economia: 2 }),
      makeReview('r2', { desempenho: 5 }),
    ]);
    expect(summary.overallAverage).toBe(3.5);
  });

  it('devolve agregado vazio quando nao ha reviews publicadas', () => {
    const summary = summarizeVehicleReviews('v1', []);
    expect(summary).toEqual({
      vehicleId: 'v1',
      categoryAverages: {},
      overallAverage: null,
      reviewCount: 0,
    });
  });

  it('aplica pesos por categoria quando informados', () => {
    const summary = summarizeVehicleReviews(
      'v1',
      [makeReview('r1', { desempenho: 5, economia: 1 })],
      { categoryWeights: { desempenho: 3, economia: 1 } },
    );
    expect(summary.overallAverage).toBe(4);
  });
});

describe('starBreakdown', () => {
  it('quebra a nota em estrelas cheias, meia e vazias', () => {
    expect(starBreakdown(4.5)).toEqual({ full: 4, half: 1, empty: 0 });
    expect(starBreakdown(3.2)).toEqual({ full: 3, half: 0, empty: 2 });
    expect(starBreakdown(3.3)).toEqual({ full: 3, half: 1, empty: 1 });
    expect(starBreakdown(null)).toEqual({ full: 0, half: 0, empty: 5 });
  });
});

describe('formatRating', () => {
  it('usa virgula decimal e travessao para sem nota', () => {
    expect(formatRating(4.25)).toBe('4,3');
    expect(formatRating(5)).toBe('5,0');
    expect(formatRating(null)).toBe('—');
  });
});

describe('rankVehicles', () => {
  it('ordena por nota e joga os sem avaliacao para o fim', () => {
    const ranked = rankVehicles([
      makeVehicle('sem-nota', {}),
      makeVehicle('bom', { overallAverage: 4.5, reviewCount: 10 }),
      makeVehicle('otimo', { overallAverage: 4.8, reviewCount: 3 }),
    ]);
    expect(ranked.map((entry) => entry.vehicle.id)).toEqual(['otimo', 'bom', 'sem-nota']);
    expect(ranked[0]?.position).toBe(1);
  });

  it('desempata por numero de avaliacoes e depois por menor preco', () => {
    const ranked = rankVehicles([
      makeVehicle('a', { overallAverage: 4.5, reviewCount: 5 }, 90_000),
      makeVehicle('b', { overallAverage: 4.5, reviewCount: 9 }, 120_000),
      makeVehicle('c', { overallAverage: 4.5, reviewCount: 5 }, 80_000),
    ]);
    expect(ranked.map((entry) => entry.vehicle.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('scoreVehicle', () => {
  it('usa a media geral quando nao ha pesos', () => {
    expect(scoreVehicle(makeVehicle('a', { overallAverage: 4.2 }))).toBe(4.2);
  });

  it('recalcula a partir das medias por categoria quando ha pesos', () => {
    const vehicle = makeVehicle('a', {
      overallAverage: 3,
      categoryAverages: { desempenho: 5, economia: 1 },
    });
    expect(scoreVehicle(vehicle, { desempenho: 3, economia: 1 })).toBe(4);
  });
});

describe('categoryWinners', () => {
  it('aponta o melhor de cada categoria e registra empates', () => {
    const winners = categoryWinners(
      [
        makeVehicle('a', { categoryAverages: { desempenho: 5, conforto: 4 } }),
        makeVehicle('b', { categoryAverages: { desempenho: 4, conforto: 4 } }),
        makeVehicle('c', { categoryAverages: { desempenho: 3, conforto: null } }),
      ],
      ['desempenho', 'conforto', 'economia'],
    );
    expect(winners.desempenho).toEqual(['a']);
    expect(winners.conforto).toEqual(['a', 'b']);
    expect(winners.economia).toEqual([]);
  });
});

describe('recommendVehicle', () => {
  it('recomenda o de melhor nota e justifica com as categorias lideradas', () => {
    const result = recommendVehicle(
      [
        makeVehicle('a', {
          overallAverage: 4.7,
          reviewCount: 8,
          categoryAverages: { desempenho: 5, economia: 4.4 },
        }),
        makeVehicle('b', {
          overallAverage: 4.1,
          reviewCount: 8,
          categoryAverages: { desempenho: 4, economia: 4.2 },
        }),
      ],
      ['desempenho', 'economia'],
    );
    expect(result?.vehicle.id).toBe('a');
    expect(result?.strongestCategories).toEqual(['desempenho', 'economia']);
    expect(result?.reason).toContain('2 de 2 categorias');
  });

  it('retorna null quando nenhum veiculo tem avaliacao', () => {
    expect(recommendVehicle([makeVehicle('a', {}), makeVehicle('b', {})], ['desempenho'])).toBeNull();
  });
});
