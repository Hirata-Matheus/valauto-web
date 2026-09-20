import { NextResponse, type NextRequest } from 'next/server';
import { parseVehicleFilters } from '@valauto/shared';
import { getRepository } from '@/lib/data';
import { handleRouteError } from '@/lib/api';

/** GET /api/vehicles — catálogo filtrado e paginado (público). */
export async function GET(request: NextRequest) {
  try {
    const filters = parseVehicleFilters(request.nextUrl.searchParams);
    const repository = await getRepository();
    const result = await repository.listVehicles(filters);

    return NextResponse.json(result, {
      headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
