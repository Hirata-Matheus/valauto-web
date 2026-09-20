import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/data';
import { errorResponse, handleRouteError } from '@/lib/api';

/** GET /api/vehicles/[slug] — detalhe de um veículo (público). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const repository = await getRepository();
    const vehicle = await repository.getVehicleBySlug(slug);

    if (!vehicle) return errorResponse('Veículo não encontrado', 404);

    return NextResponse.json(vehicle, {
      headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
