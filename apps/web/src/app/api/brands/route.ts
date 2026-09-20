import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/data';
import { handleRouteError } from '@/lib/api';

/** GET /api/brands — montadoras para o filtro do catálogo (público). */
export async function GET() {
  try {
    const repository = await getRepository();
    const brands = await repository.listBrands();

    return NextResponse.json(brands, {
      headers: { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
