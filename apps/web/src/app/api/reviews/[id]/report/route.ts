import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, handleRouteError, sanitizeText } from '@/lib/api';
import { clientKey, pruneRateLimitBuckets, rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  reason: z.string().trim().min(5, 'Descreva o motivo').max(500),
});

/** POST /api/reviews/[id]/report — envia a review para a fila de moderação. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();
    if (!user) return errorResponse('Entre na sua conta para denunciar uma avaliação.', 401);

    pruneRateLimitBuckets();
    const limit = rateLimit(`report:${clientKey(request, user.id)}`, 5, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Muitas denúncias em sequência. Tente novamente em instantes.' },
        { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
      );
    }

    const { reason } = bodySchema.parse(await request.json());

    const repository = await getRepository();
    await repository.reportReview(id, user.id, sanitizeText(reason));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
