import { MessageSquare } from 'lucide-react';
import { formatDate, formatRating, type RatingCategory, type Review } from '@valauto/shared';
import { StarRating } from '@/components/ui/star-rating';
import { ReportReviewButton } from './report-review-button';

export function ReviewList({
  reviews,
  categories,
}: {
  reviews: Review[];
  categories: RatingCategory[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2 px-6 py-12 text-center">
        <MessageSquare className="h-8 w-8 text-content-muted" aria-hidden="true" />
        <h3 className="font-semibold">Nenhuma opinião publicada ainda</h3>
        <p className="text-sm text-content-secondary">
          Seja a primeira pessoa a avaliar este veículo.
        </p>
      </div>
    );
  }

  const categoryName = new Map(categories.map((category) => [category.slug, category.name]));

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id} className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-full bg-base-800 text-sm font-semibold text-accent-300"
                aria-hidden="true"
              >
                {review.author.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium text-content-primary">{review.author.name}</p>
                <p className="text-caption text-content-muted">
                  <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                  {review.updatedAt !== review.createdAt && ' · editada'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StarRating value={review.overall} showValue />
              <ReportReviewButton reviewId={review.id} />
            </div>
          </div>

          {review.comment && (
            <p className="mt-3 whitespace-pre-line text-content-secondary">{review.comment}</p>
          )}

          <ul className="mt-4 flex flex-wrap gap-2">
            {review.ratings.map((rating) => (
              <li key={rating.categoryId} className="badge">
                {categoryName.get(rating.categorySlug) ?? rating.categorySlug}
                <strong className="text-accent-300">{formatRating(rating.score)}</strong>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
