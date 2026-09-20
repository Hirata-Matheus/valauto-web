import {
  applyVehicleFilters,
  reviewOverall,
  summarizeVehicleReviews,
  type Brand,
  type Paginated,
  type RatingCategory,
  type Review,
  type ReviewInput,
  type Vehicle,
  type VehicleFilters,
  type VehicleType,
} from '@valauto/shared';
import { RepositoryError, type VehicleRepository } from './repository';
import { seedBrands, seedRatingCategories, seedReviews, seedVehicles, seedVehicleTypes } from './seed';

/**
 * Repositorio em memoria para desenvolvimento sem Supabase.
 *
 * Reutiliza applyVehicleFilters/summarizeVehicleReviews de packages/shared —
 * as mesmas funcoes testadas por Vitest — entao o comportamento de filtro e de
 * media bate com o que o Postgres faz em producao.
 *
 * As escritas ficam no processo e se perdem no restart; o fluxo de publicar
 * opiniao de verdade exige Supabase (a verificacao de e-mail depende dele).
 */
class MemoryRepository implements VehicleRepository {
  private readonly vehicles: Vehicle[] = seedVehicles.map((vehicle) => ({ ...vehicle }));
  private readonly reviews = new Map<string, Review[]>(
    [...seedReviews.entries()].map(([vehicleId, list]) => [vehicleId, [...list]]),
  );

  async listVehicleTypes(): Promise<VehicleType[]> {
    return seedVehicleTypes;
  }

  async listBrands(): Promise<Brand[]> {
    return [...seedBrands].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async listRatingCategories(type?: string): Promise<RatingCategory[]> {
    return seedRatingCategories.filter(
      (category) =>
        !type || category.appliesTo.length === 0 || category.appliesTo.includes(type),
    );
  }

  async listVehicles(filters: VehicleFilters): Promise<Paginated<Vehicle>> {
    return applyVehicleFilters(this.vehicles, filters);
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.slug === slug) ?? null;
  }

  async listVehicleSlugs(): Promise<string[]> {
    return this.vehicles.map((vehicle) => vehicle.slug);
  }

  async listReviews(vehicleId: string): Promise<Review[]> {
    const list = this.reviews.get(vehicleId) ?? [];
    return list
      .filter((review) => review.status === 'published')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getUserReview(vehicleId: string, userId: string): Promise<Review | null> {
    const list = this.reviews.get(vehicleId) ?? [];
    return list.find((review) => review.author.id === userId) ?? null;
  }

  async upsertReview(userId: string, input: ReviewInput): Promise<Review> {
    const vehicle = this.vehicles.find((item) => item.id === input.vehicleId);
    if (!vehicle) throw new RepositoryError('Veículo não encontrado', 404);

    const categories = await this.listRatingCategories();
    const ratings = input.ratings.map((rating) => {
      const category = categories.find((item) => item.id === rating.categoryId);
      if (!category) throw new RepositoryError('Categoria de avaliação inválida', 400);
      return { categoryId: category.id, categorySlug: category.slug, score: rating.score };
    });

    const list = this.reviews.get(vehicle.id) ?? [];
    const existing = list.find((review) => review.author.id === userId);
    const now = new Date().toISOString();

    const review: Review = existing
      ? {
          ...existing,
          ratings,
          overall: reviewOverall({ ratings }) ?? 0,
          comment: input.comment ?? null,
          updatedAt: now,
        }
      : {
          id: crypto.randomUUID(),
          vehicleId: vehicle.id,
          author: { id: userId, name: 'Você', avatarUrl: null },
          ratings,
          overall: reviewOverall({ ratings }) ?? 0,
          comment: input.comment ?? null,
          status: 'published',
          createdAt: now,
          updatedAt: now,
        };

    const nextList = existing
      ? list.map((item) => (item.id === existing.id ? review : item))
      : [review, ...list];

    this.reviews.set(vehicle.id, nextList);
    vehicle.summary = summarizeVehicleReviews(vehicle.id, nextList);

    return review;
  }

  async reportReview(reviewId: string, _reporterId: string, _reason: string): Promise<void> {
    for (const [vehicleId, list] of this.reviews) {
      const target = list.find((review) => review.id === reviewId);
      if (!target) continue;
      const nextList = list.map((review) =>
        review.id === reviewId ? { ...review, status: 'reported' as const } : review,
      );
      this.reviews.set(vehicleId, nextList);
      const vehicle = this.vehicles.find((item) => item.id === vehicleId);
      if (vehicle) vehicle.summary = summarizeVehicleReviews(vehicleId, nextList);
      return;
    }
    throw new RepositoryError('Avaliação não encontrada', 404);
  }
}

/** Instancia unica — o estado precisa sobreviver entre requisicoes em dev. */
const globalForMemoryRepo = globalThis as unknown as { valautoMemoryRepo?: MemoryRepository };

export function createMemoryRepository(): VehicleRepository {
  globalForMemoryRepo.valautoMemoryRepo ??= new MemoryRepository();
  return globalForMemoryRepo.valautoMemoryRepo;
}
