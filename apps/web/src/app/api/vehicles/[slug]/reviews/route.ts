import { NextResponse } from 'next/server';
import { getPublicRepository } from '@/lib/data';
import { errorResponse, handleRouteError } from '@/lib/api';

/** GET /api/vehicles/[slug]/reviews — opiniões publicadas do veículo (público). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const repository = getPublicRepository();

    const vehicle = await repository.getVehicleBySlug(slug);
    if (!vehicle) return errorResponse('Veículo não encontrado', 404);

    const reviews = await repository.listReviews(vehicle.id);

    return NextResponse.json(reviews, {
      headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
