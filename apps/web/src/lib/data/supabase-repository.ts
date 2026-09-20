import type { SupabaseClient } from '@supabase/supabase-js';
import {
  reviewOverall,
  type Brand,
  type Paginated,
  type RatingCategory,
  type Review,
  type ReviewInput,
  type Vehicle,
  type VehicleFilters,
  type VehicleRatingSummary,
  type VehicleType,
} from '@valauto/shared';
import { RepositoryError, type VehicleRepository } from './repository';

/**
 * Repositorio sobre o Postgres do Supabase.
 *
 * As medias vem prontas de vehicle_rating_summaries (mantida por trigger), e
 * nao sao recalculadas aqui: o catalogo precisa ordenar e filtrar por nota no
 * banco, o que exige a coluna materializada.
 */

const VEHICLE_SELECT = `
  id, slug, model, type, year, price, short_description, description, images, specs, created_at,
  brand:brands!inner (id, name, slug, logo_url, country),
  summary:vehicle_rating_summaries!inner (category_averages, overall_average, review_count, updated_at)
`;

const REVIEW_SELECT = `
  id, vehicle_id, comment, status, created_at, updated_at,
  author:profiles!inner (id, name, avatar_url),
  ratings:review_ratings (score, category:rating_categories!inner (id, slug))
`;

/** PostgREST devolve relacao embutida ora como objeto, ora como array de um item. */
function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function escapeLike(value: string): string {
  // Virgula e parenteses quebram a sintaxe de filtro do PostgREST.
  return value.replace(/[,()%*]/g, ' ').trim();
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
}

interface SummaryRow {
  category_averages: Record<string, number | string | null> | null;
  overall_average: number | string | null;
  review_count: number | null;
  updated_at?: string | null;
}

interface VehicleRow {
  id: string;
  slug: string;
  model: string;
  type: string;
  year: number;
  price: number | string;
  short_description: string | null;
  description: string | null;
  images: string[] | null;
  specs: Record<string, number | string> | null;
  created_at: string;
  brand: BrandRow | BrandRow[] | null;
  summary: SummaryRow | SummaryRow[] | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    country: row.country,
  };
}

function mapSummary(vehicleId: string, row: SummaryRow | null): VehicleRatingSummary {
  const averages: Record<string, number | null> = {};
  for (const [slug, value] of Object.entries(row?.category_averages ?? {})) {
    averages[slug] = toNumber(value as number | string | null);
  }
  return {
    vehicleId,
    categoryAverages: averages,
    overallAverage: toNumber(row?.overall_average ?? null),
    reviewCount: row?.review_count ?? 0,
    updatedAt: row?.updated_at ?? undefined,
  };
}

function mapVehicle(row: VehicleRow): Vehicle {
  const brand = one(row.brand);
  if (!brand) throw new RepositoryError('Veículo sem montadora associada', 500);

  return {
    id: row.id,
    slug: row.slug,
    brand: mapBrand(brand),
    model: row.model,
    type: row.type,
    year: row.year,
    price: toNumber(row.price) ?? 0,
    shortDescription: row.short_description,
    description: row.description,
    images: row.images ?? [],
    specs: row.specs ?? {},
    summary: mapSummary(row.id, one(row.summary)),
    createdAt: row.created_at,
  };
}

interface ReviewRow {
  id: string;
  vehicle_id: string;
  comment: string | null;
  status: Review['status'];
  created_at: string;
  updated_at: string;
  author: { id: string; name: string; avatar_url: string | null } | Array<{ id: string; name: string; avatar_url: string | null }> | null;
  ratings:
    | Array<{ score: number | string; category: { id: string; slug: string } | Array<{ id: string; slug: string }> | null }>
    | null;
}

function mapReview(row: ReviewRow): Review {
  const author = one(row.author);
  const ratings = (row.ratings ?? []).flatMap((rating) => {
    const category = one(rating.category);
    const score = toNumber(rating.score);
    if (!category || score === null) return [];
    return [{ categoryId: category.id, categorySlug: category.slug, score }];
  });

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    author: {
      id: author?.id ?? '',
      name: author?.name?.trim() || 'Usuário ValAuto',
      avatarUrl: author?.avatar_url ?? null,
    },
    ratings,
    overall: reviewOverall({ ratings }) ?? 0,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseRepository implements VehicleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listVehicleTypes(): Promise<VehicleType[]> {
    const { data, error } = await this.supabase
      .from('vehicle_types')
      .select('slug, label, position')
      .order('position');
    if (error) throw new RepositoryError(error.message);
    return (data ?? []).map((row) => ({
      slug: row.slug as string,
      label: row.label as string,
      position: (row.position as number) ?? 0,
    }));
  }

  async listBrands(): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('id, name, slug, logo_url, country')
      .order('name');
    if (error) throw new RepositoryError(error.message);
    return (data ?? []).map((row) => mapBrand(row as BrandRow));
  }

  async listRatingCategories(type?: string): Promise<RatingCategory[]> {
    const { data, error } = await this.supabase
      .from('rating_categories')
      .select('id, slug, name, description, applies_to, position')
      .order('position');
    if (error) throw new RepositoryError(error.message);

    return (data ?? [])
      .map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        description: (row.description as string | null) ?? null,
        appliesTo: (row.applies_to as string[] | null) ?? [],
        position: (row.position as number) ?? 0,
      }))
      .filter(
        (category) => !type || category.appliesTo.length === 0 || category.appliesTo.includes(type),
      );
  }

  async listVehicles(filters: VehicleFilters): Promise<Paginated<Vehicle>> {
    let query = this.supabase.from('vehicles').select(VEHICLE_SELECT, { count: 'exact' });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.brand) query = query.eq('brand.slug', filters.brand);
    if (filters.yearMin !== undefined) query = query.gte('year', filters.yearMin);
    if (filters.yearMax !== undefined) query = query.lte('year', filters.yearMax);
    if (filters.priceMin !== undefined) query = query.gte('price', filters.priceMin);
    if (filters.priceMax !== undefined) query = query.lte('price', filters.priceMax);
    if (filters.minRating !== undefined && filters.minRating > 0) {
      query = query.gte('summary.overall_average', filters.minRating);
    }

    if (filters.q) {
      const term = escapeLike(filters.q);
      if (term.length > 0) {
        // Busca no modelo do veiculo ou no nome da montadora.
        const brandIds = await this.findBrandIdsByName(term);
        const clauses = [`model.ilike.*${term}*`];
        if (brandIds.length > 0) clauses.push(`brand_id.in.(${brandIds.join(',')})`);
        query = query.or(clauses.join(','));
      }
    }

    switch (filters.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'year_asc':
        query = query.order('year', { ascending: true });
        break;
      case 'year_desc':
        query = query.order('year', { ascending: false });
        break;
      // Ordenar o registro PAI por uma coluna do relacionado exige a sintaxe
      // `relacao(coluna)`. A opcao `referencedTable` NAO serve aqui: ela so
      // ordena as linhas embutidas e deixa os veiculos na ordem original.
      // Sem nota (null) fica sempre no fim, nos dois sentidos.
      case 'rating_asc':
        query = query.order('summary(overall_average)', { ascending: true, nullsFirst: false });
        break;
      case 'rating_desc':
      default:
        query = query.order('summary(overall_average)', { ascending: false, nullsFirst: false });
        break;
    }
    // Desempate estavel — sem isso a paginacao pode repetir itens.
    query = query.order('id', { ascending: true });

    const from = (filters.page - 1) * filters.perPage;
    const { data, error, count } = await query.range(from, from + filters.perPage - 1);
    if (error) throw new RepositoryError(error.message);

    const total = count ?? 0;
    return {
      items: (data ?? []).map((row) => mapVehicle(row as unknown as VehicleRow)),
      total,
      page: filters.page,
      perPage: filters.perPage,
      totalPages: Math.max(1, Math.ceil(total / filters.perPage)),
    };
  }

  private async findBrandIdsByName(term: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${term}%`);
    if (error) throw new RepositoryError(error.message);
    return (data ?? []).map((row) => row.id as string);
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select(VEHICLE_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new RepositoryError(error.message);
    if (!data) return null;
    return mapVehicle(data as unknown as VehicleRow);
  }

  async listVehicleSlugs(): Promise<string[]> {
    const { data, error } = await this.supabase.from('vehicles').select('slug');
    if (error) throw new RepositoryError(error.message);
    return (data ?? []).map((row) => row.slug as string);
  }

  async listReviews(vehicleId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .eq('vehicle_id', vehicleId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw new RepositoryError(error.message);
    return (data ?? []).map((row) => mapReview(row as unknown as ReviewRow));
  }

  async getUserReview(vehicleId: string, userId: string): Promise<Review | null> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .eq('vehicle_id', vehicleId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new RepositoryError(error.message);
    if (!data) return null;
    return mapReview(data as unknown as ReviewRow);
  }

  async upsertReview(userId: string, input: ReviewInput): Promise<Review> {
    // 1 review por usuario/veiculo: a unique (vehicle_id, user_id) transforma
    // a segunda publicacao numa edicao da primeira.
    const { data: review, error: reviewError } = await this.supabase
      .from('reviews')
      .upsert(
        {
          vehicle_id: input.vehicleId,
          user_id: userId,
          comment: input.comment ?? null,
          status: 'published',
        },
        { onConflict: 'vehicle_id,user_id' },
      )
      .select('id')
      .single();

    if (reviewError) {
      // RLS barra quem nao tem e-mail verificado.
      const status = reviewError.code === '42501' ? 403 : 400;
      throw new RepositoryError(
        status === 403
          ? 'Confirme seu e-mail para publicar uma avaliação.'
          : reviewError.message,
        status,
      );
    }

    const reviewId = review.id as string;

    const { error: deleteError } = await this.supabase
      .from('review_ratings')
      .delete()
      .eq('review_id', reviewId);
    if (deleteError) throw new RepositoryError(deleteError.message);

    const { error: insertError } = await this.supabase.from('review_ratings').insert(
      input.ratings.map((rating) => ({
        review_id: reviewId,
        category_id: rating.categoryId,
        score: rating.score,
      })),
    );
    if (insertError) throw new RepositoryError(insertError.message);

    const { data: saved, error: readError } = await this.supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .eq('id', reviewId)
      .single();
    if (readError) throw new RepositoryError(readError.message);

    return mapReview(saved as unknown as ReviewRow);
  }

  async reportReview(reviewId: string, reporterId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('review_reports')
      .insert({ review_id: reviewId, reporter_id: reporterId, reason });
    if (error) {
      // Denuncia repetida do mesmo usuario nao e erro para quem esta usando.
      if (error.code === '23505') return;
      throw new RepositoryError(error.message);
    }
  }
}

export function createSupabaseRepository(supabase: SupabaseClient): VehicleRepository {
  return new SupabaseRepository(supabase);
}
