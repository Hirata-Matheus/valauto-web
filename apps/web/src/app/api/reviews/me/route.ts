import { NextResponse, type NextRequest } from 'next/server';
import { getRepository } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, handleRouteError } from '@/lib/api';

/**
 * GET /api/reviews/me?vehicleId=... — a opinião do próprio usuário sobre um
 * veículo, se existir. Alimenta o modo de edição do formulário (1 review por
 * usuário por veículo). Responde 200 com `null` quando ainda não há.
 */
export async function GET(request: NextRequest) {
  try {
    const vehicleId = request.nextUrl.searchParams.get('vehicleId');
    if (!vehicleId) return errorResponse('Informe o vehicleId', 400);

    const user = await getCurrentUser();
    if (!user) return errorResponse('Não autenticado', 401);

    const repository = await getRepository();
    const review = await repository.getUserReview(vehicleId, user.id);

    return NextResponse.json(review, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return handleRouteError(error);
  }
}
