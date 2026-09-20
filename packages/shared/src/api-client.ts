import { serializeVehicleFilters } from './filters';
import type { VehicleFilters, ReviewInput } from './schemas';
import type { Brand, Paginated, RatingCategory, Review, Vehicle } from './types';

/**
 * Client HTTP das Route Handlers do Next (BFF).
 *
 * Fica em packages/shared porque o app mobile vai consumir exatamente os mesmos
 * endpoints — basta instanciar com outro baseUrl e um getter de token.
 */
export interface ApiClientOptions {
  /** Ex.: "" no browser do web, "https://valauto.app" no mobile. */
  baseUrl?: string;
  /** Token de sessao; no web a sessao vai por cookie httpOnly e isto fica vazio. */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await options.getAccessToken?.();
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');
    if (init.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await doFetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });

    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: unknown }).error)
          : null) ?? `Falha na requisição (${response.status})`;
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  return {
    listVehicles(filters: Partial<VehicleFilters>): Promise<Paginated<Vehicle>> {
      const query = serializeVehicleFilters(filters).toString();
      return request<Paginated<Vehicle>>(`/api/vehicles${query ? `?${query}` : ''}`);
    },
    getVehicle(slug: string): Promise<Vehicle> {
      return request<Vehicle>(`/api/vehicles/${encodeURIComponent(slug)}`);
    },
    listBrands(): Promise<Brand[]> {
      return request<Brand[]>('/api/brands');
    },
    listRatingCategories(type?: string): Promise<RatingCategory[]> {
      return request<RatingCategory[]>(
        `/api/rating-categories${type ? `?type=${encodeURIComponent(type)}` : ''}`,
      );
    },
    listReviews(vehicleSlug: string): Promise<Review[]> {
      return request<Review[]>(`/api/vehicles/${encodeURIComponent(vehicleSlug)}/reviews`);
    },
    /** Opiniao do proprio usuario sobre o veiculo; null quando ainda nao existe. */
    getMyReview(vehicleId: string): Promise<Review | null> {
      return request<Review | null>(`/api/reviews/me?vehicleId=${encodeURIComponent(vehicleId)}`);
    },
    /** Publica ou edita: a unique (vehicle_id, user_id) faz o upsert. */
    createReview(input: ReviewInput): Promise<Review> {
      return request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(input) });
    },
    reportReview(reviewId: string, reason: string): Promise<void> {
      return request<void>(`/api/reviews/${encodeURIComponent(reviewId)}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
