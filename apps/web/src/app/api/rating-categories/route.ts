import { NextResponse, type NextRequest } from 'next/server';
import { getPublicRepository } from '@/lib/data';
import { handleRouteError } from '@/lib/api';

/** GET /api/rating-categories?type=carro — categorias aplicáveis ao tipo (público). */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') ?? undefined;
    const repository = getPublicRepository();
    const categories = await repository.listRatingCategories(type);

    return NextResponse.json(categories, {
      headers: { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
