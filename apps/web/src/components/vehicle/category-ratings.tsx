import { RATING_MAX, formatRating, type RatingCategory, type VehicleRatingSummary } from '@valauto/shared';
import { StarRating } from '@/components/ui/star-rating';

/** Notas por categoria com barra proporcional. */
export function CategoryRatings({
  categories,
  summary,
}: {
  categories: RatingCategory[];
  summary: VehicleRatingSummary;
}) {
  return (
    <dl className="flex flex-col gap-4">
      {categories.map((category) => {
        const value = summary.categoryAverages[category.slug] ?? null;
        const percentage = value === null ? 0 : (value / RATING_MAX) * 100;

        return (
          <div key={category.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm font-medium text-content-primary">{category.name}</dt>
              <dd className="flex items-center gap-2">
                <StarRating value={value} size="sm" />
                <span className="w-8 text-right text-sm font-semibold tabular-nums text-content-primary">
                  {formatRating(value)}
                </span>
              </dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-base-800" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-300 transition-[width] duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {category.description && (
              <p className="text-caption text-content-muted">{category.description}</p>
            )}
          </div>
        );
      })}
    </dl>
  );
}
