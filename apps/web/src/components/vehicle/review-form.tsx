'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REVIEW_COMMENT_MAX_LENGTH, reviewInputSchema, type RatingCategory, type Review } from '@valauto/shared';
import { StarRatingInput } from '@/components/ui/star-rating-input';

/**
 * Formulario de opiniao.
 *
 * Valida com o mesmo schema Zod que a rota de API usa (packages/shared), entao
 * a mensagem que aparece aqui e a mesma regra aplicada no servidor — o client
 * apenas antecipa o erro.
 */
export function ReviewForm({
  vehicleId,
  categories,
  existingReview,
}: {
  vehicleId: string;
  categories: RatingCategory[];
  existingReview: Review | null;
}) {
  const router = useRouter();

  const [scores, setScores] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    for (const category of categories) {
      initial[category.id] =
        existingReview?.ratings.find((rating) => rating.categoryId === category.id)?.score ?? null;
    }
    return initial;
  });
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const ratings = Object.entries(scores)
      .filter((entry): entry is [string, number] => entry[1] !== null)
      .map(([categoryId, score]) => ({ categoryId, score }));

    const parsed = reviewInputSchema.safeParse({
      vehicleId,
      ratings,
      comment: comment.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os campos preenchidos.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Não foi possível publicar sua avaliação.');
      }

      setSaved(true);
      // Recarrega o server component para refletir a nova média agregada.
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  }

  const filledCount = Object.values(scores).filter((score) => score !== null).length;

  return (
    <form onSubmit={handleSubmit} className="surface flex flex-col gap-5 p-5">
      <div>
        <h3 className="text-h3 font-semibold">
          {existingReview ? 'Editar sua avaliação' : 'Publicar sua avaliação'}
        </h3>
        <p className="text-sm text-content-secondary">
          Dê uma nota de 1 a 5 (com meia estrela) nas categorias que você conhece. A média geral é
          calculada a partir delas.
        </p>
      </div>

      <div className="flex flex-col gap-4 divide-y divide-line-subtle">
        {categories.map((category) => (
          <div key={category.id} className="pt-4 first:pt-0">
            <StarRatingInput
              name={`rating-${category.id}`}
              label={category.name}
              description={category.description}
              value={scores[category.id] ?? null}
              onChange={(value) => setScores((prev) => ({ ...prev, [category.id]: value }))}
            />
          </div>
        ))}
      </div>

      <label className="block">
        <span className="label">Comentário (opcional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          rows={4}
          className="field resize-y"
          placeholder="Conte como é o uso no dia a dia, consumo real, pontos fortes e fracos…"
        />
        <span className="mt-1 block text-right text-caption text-content-muted">
          {comment.length}/{REVIEW_COMMENT_MAX_LENGTH}
        </span>
      </label>

      {error && (
        <p className="rounded-token border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-token border border-status-success/40 bg-status-success/10 px-3 py-2 text-sm text-status-success" role="status">
          Avaliação publicada. Obrigado por contribuir!
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-caption text-content-muted">
          {filledCount} de {categories.length} categorias avaliadas
        </span>
        <button type="submit" disabled={isSaving || filledCount === 0} className="btn-primary">
          {isSaving ? 'Publicando…' : existingReview ? 'Salvar alterações' : 'Publicar avaliação'}
        </button>
      </div>
    </form>
  );
}
