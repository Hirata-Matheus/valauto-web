import { RATING_MAX, RATING_MIN, RATING_STEP } from './constants';
import type { Review, Vehicle, VehicleRatingSummary } from './types';

/** Arredonda para a meia estrela mais proxima (0,5). */
export function roundToHalf(value: number): number {
  return Math.round(value / RATING_STEP) * RATING_STEP;
}

/** Arredonda para 1 casa decimal — formato usado nas medias exibidas. */
export function roundToDecimal(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clampRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, value));
}

/** Uma nota so e valida se estiver em [1, 5] e cair num multiplo de 0,5. */
export function isValidRatingValue(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < RATING_MIN || value > RATING_MAX) return false;
  return Math.abs(value / RATING_STEP - Math.round(value / RATING_STEP)) < Number.EPSILON * 8;
}

/** Media simples. Retorna null para lista vazia (nao existe "media zero"). */
export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

/**
 * Media ponderada. Pesos ausentes ou <= 0 sao tratados como 0; se a soma dos
 * pesos aplicaveis for 0, cai para media simples em vez de dividir por zero.
 */
export function weightedAverage(
  entries: readonly { value: number; weight?: number }[],
): number | null {
  if (entries.length === 0) return null;
  const usable = entries.filter((entry) => (entry.weight ?? 1) > 0);
  if (usable.length === 0) return average(entries.map((entry) => entry.value));
  const totalWeight = usable.reduce((acc, entry) => acc + (entry.weight ?? 1), 0);
  const sum = usable.reduce((acc, entry) => acc + entry.value * (entry.weight ?? 1), 0);
  return sum / totalWeight;
}

/** Media geral de uma unica review (media das categorias que ela pontuou). */
export function reviewOverall(review: Pick<Review, 'ratings'>): number | null {
  const result = average(review.ratings.map((rating) => rating.score));
  return result === null ? null : roundToDecimal(result);
}

/**
 * Agrega as reviews publicadas de um veiculo.
 *
 * Regras:
 * - apenas reviews com status "published" entram no agregado;
 * - a media de cada categoria considera somente as reviews que pontuaram aquela
 *   categoria (categoria sem nota fica null, nao zero);
 * - a media geral e a media das medias por categoria, para que uma categoria
 *   com muitas notas nao domine as demais.
 */
export function summarizeVehicleReviews(
  vehicleId: string,
  reviews: readonly Review[],
  options: { categoryWeights?: Record<string, number> } = {},
): VehicleRatingSummary {
  const published = reviews.filter((review) => review.status === 'published');
  const scoresByCategory = new Map<string, number[]>();

  for (const review of published) {
    for (const rating of review.ratings) {
      const bucket = scoresByCategory.get(rating.categorySlug);
      if (bucket) bucket.push(rating.score);
      else scoresByCategory.set(rating.categorySlug, [rating.score]);
    }
  }

  const categoryAverages: Record<string, number | null> = {};
  const overallEntries: { value: number; weight?: number }[] = [];

  for (const [slug, scores] of scoresByCategory) {
    const categoryAverage = average(scores);
    categoryAverages[slug] = categoryAverage === null ? null : roundToDecimal(categoryAverage);
    if (categoryAverage !== null) {
      overallEntries.push({ value: categoryAverage, weight: options.categoryWeights?.[slug] ?? 1 });
    }
  }

  const overall = weightedAverage(overallEntries);

  return {
    vehicleId,
    categoryAverages,
    overallAverage: overall === null ? null : roundToDecimal(overall),
    reviewCount: published.length,
  };
}

/** Quantas estrelas cheias / meia / vazias desenhar para uma nota. */
export function starBreakdown(
  value: number | null,
  total = RATING_MAX,
): { full: number; half: number; empty: number } {
  if (value === null || value <= 0) return { full: 0, half: 0, empty: total };
  const rounded = roundToHalf(clampRating(value));
  const full = Math.floor(rounded);
  const half = rounded - full >= RATING_STEP ? 1 : 0;
  return { full, half, empty: Math.max(0, total - full - half) };
}

export function formatRating(value: number | null): string {
  if (value === null) return '—';
  return roundToDecimal(value).toFixed(1).replace('.', ',');
}

// ---------------------------------------------------------------------------
// Ranking / recomendacao — funcoes puras consumidas pelo comparador (Fase 2).
// ---------------------------------------------------------------------------

export interface RankedVehicle {
  vehicle: Vehicle;
  score: number;
  position: number;
}

/**
 * Ordena veiculos por nota. Veiculos sem avaliacao vao para o fim (score -1),
 * e o desempate e por numero de avaliacoes e depois por preco menor.
 */
export function rankVehicles(
  vehicles: readonly Vehicle[],
  options: { categoryWeights?: Record<string, number> } = {},
): RankedVehicle[] {
  const scored = vehicles.map((vehicle) => ({
    vehicle,
    score: scoreVehicle(vehicle, options.categoryWeights) ?? -1,
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const countDiff = b.vehicle.summary.reviewCount - a.vehicle.summary.reviewCount;
    if (countDiff !== 0) return countDiff;
    return a.vehicle.price - b.vehicle.price;
  });

  return scored.map((entry, index) => ({ ...entry, position: index + 1 }));
}

/**
 * Nota do veiculo considerando pesos por categoria. Sem pesos informados, usa a
 * media geral ja agregada; com pesos, recalcula a partir das medias por categoria.
 */
export function scoreVehicle(
  vehicle: Vehicle,
  categoryWeights?: Record<string, number>,
): number | null {
  if (!categoryWeights || Object.keys(categoryWeights).length === 0) {
    return vehicle.summary.overallAverage;
  }
  const entries = Object.entries(vehicle.summary.categoryAverages)
    .filter((entry): entry is [string, number] => entry[1] !== null)
    .map(([slug, value]) => ({ value, weight: categoryWeights[slug] ?? 1 }));
  const result = weightedAverage(entries);
  return result === null ? null : roundToDecimal(result);
}

/** Vencedor de cada categoria num grupo comparado (empate => varios ids). */
export function categoryWinners(
  vehicles: readonly Vehicle[],
  categorySlugs: readonly string[],
): Record<string, string[]> {
  const winners: Record<string, string[]> = {};

  for (const slug of categorySlugs) {
    let best: number | null = null;
    let ids: string[] = [];

    for (const vehicle of vehicles) {
      const value = vehicle.summary.categoryAverages[slug] ?? null;
      if (value === null) continue;
      if (best === null || value > best) {
        best = value;
        ids = [vehicle.id];
      } else if (value === best) {
        ids.push(vehicle.id);
      }
    }

    winners[slug] = ids;
  }

  return winners;
}

export interface Recommendation {
  vehicle: Vehicle;
  score: number;
  /** Categorias em que o recomendado e o melhor do grupo. */
  strongestCategories: string[];
  reason: string;
}

/** Aponta o melhor veiculo do grupo comparado, com justificativa curta. */
export function recommendVehicle(
  vehicles: readonly Vehicle[],
  categorySlugs: readonly string[],
  options: { categoryWeights?: Record<string, number> } = {},
): Recommendation | null {
  const ranked = rankVehicles(vehicles, options);
  const top = ranked[0];
  if (!top || top.score < 0) return null;

  const winners = categoryWinners(vehicles, categorySlugs);
  const strongestCategories = categorySlugs.filter((slug) =>
    (winners[slug] ?? []).includes(top.vehicle.id),
  );

  const name = `${top.vehicle.brand.name} ${top.vehicle.model}`;
  const rating = formatRating(top.score);
  const reason =
    strongestCategories.length > 0
      ? `${name} lidera com nota ${rating} e é o melhor do grupo em ${strongestCategories.length} de ${categorySlugs.length} categorias.`
      : `${name} tem a melhor nota geral do grupo (${rating}), mesmo sem liderar nenhuma categoria isolada.`;

  return { vehicle: top.vehicle, score: top.score, strongestCategories, reason };
}
