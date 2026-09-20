import { NextResponse } from 'next/server';
import { reviewInputSchema } from '@valauto/shared';
import { getRepository } from '@/lib/data';
import { getCurrentUser, isEmailVerified } from '@/lib/auth';
import { errorResponse, handleRouteError, sanitizeText } from '@/lib/api';
import { clientKey, pruneRateLimitBuckets, rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/reviews — publica ou edita a opinião do usuário logado.
 *
 * Três camadas de proteção, de fora para dentro: rate limit, checagem de
 * e-mail verificado aqui, e a policy de RLS no Postgres (que barra mesmo se
 * esta rota for contornada).
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse('Entre na sua conta para publicar uma avaliação.', 401);

    if (!isEmailVerified(user)) {
      return errorResponse('Confirme seu e-mail para publicar uma avaliação.', 403);
    }

    pruneRateLimitBuckets();
    const limit = rateLimit(`review:${clientKey(request, user.id)}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Muitas publicações em sequência. Tente novamente em instantes.' },
        { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
      );
    }

    const body = await request.json();
    const input = reviewInputSchema.parse(body);

    const repository = await getRepository();
    const review = await repository.upsertReview(user.id, {
      ...input,
      comment: input.comment ? sanitizeText(input.comment) : undefined,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
