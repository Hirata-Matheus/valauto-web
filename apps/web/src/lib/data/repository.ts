import type {
  Brand,
  Paginated,
  RatingCategory,
  Review,
  ReviewInput,
  Vehicle,
  VehicleFilters,
  VehicleType,
} from '@valauto/shared';

/**
 * Contrato da camada de dados.
 *
 * Duas implementacoes: Supabase (producao) e memoria (dev sem credenciais).
 * As paginas e rotas de API falam apenas com esta interface, entao trocar de
 * backend nao toca a UI.
 */
export interface VehicleRepository {
  listVehicleTypes(): Promise<VehicleType[]>;
  listBrands(): Promise<Brand[]>;
  listRatingCategories(type?: string): Promise<RatingCategory[]>;
  listVehicles(filters: VehicleFilters): Promise<Paginated<Vehicle>>;
  getVehicleBySlug(slug: string): Promise<Vehicle | null>;
  /** Slugs para generateStaticParams / sitemap. */
  listVehicleSlugs(): Promise<string[]>;
  listReviews(vehicleId: string): Promise<Review[]>;
  /** Review do usuario logado para o veiculo, se existir (1 por usuario/veiculo). */
  getUserReview(vehicleId: string, userId: string): Promise<Review | null>;
  upsertReview(userId: string, input: ReviewInput): Promise<Review>;
  reportReview(reviewId: string, reporterId: string, reason: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
