import { RATING_MAX, formatRating, roundToHalf } from '@valauto/shared';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
} as const;

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

interface StarRatingProps {
  /** Nota de 0 a 5; null quando ainda nao ha avaliacoes. */
  value: number | null;
  size?: keyof typeof SIZES;
  /** Mostra o numero ao lado das estrelas. */
  showValue?: boolean;
  /** Contagem de avaliacoes exibida em seguida. */
  reviewCount?: number;
  className?: string;
}

/**
 * Exibicao de nota em estrelas com granularidade de meia estrela.
 *
 * A meia estrela sai de uma camada preenchida recortada por largura, em vez de
 * um icone "metade" separado — assim 4,5 e 4,25 (arredondado) usam o mesmo
 * caminho de render. Componente puro: roda em Server Component.
 */
export function StarRating({
  value,
  size = 'md',
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const rounded = value === null ? null : roundToHalf(Math.min(RATING_MAX, Math.max(0, value)));
  const percentage = rounded === null ? 0 : (rounded / RATING_MAX) * 100;
  const iconClass = SIZES[size];

  const label =
    rounded === null
      ? 'Sem avaliações ainda'
      : `Nota ${formatRating(rounded)} de ${RATING_MAX}${
          reviewCount !== undefined ? `, ${reviewCount} avaliações` : ''
        }`;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="relative inline-flex"
        role="img"
        aria-label={label}
        data-rating={rounded ?? undefined}
      >
        {/* Camada vazia */}
        <span className="inline-flex gap-0.5 text-line-strong" aria-hidden="true">
          {Array.from({ length: RATING_MAX }, (_, index) => (
            <StarIcon key={index} className={iconClass} />
          ))}
        </span>
        {/* Camada preenchida, recortada na proporcao da nota */}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        >
          <span className="inline-flex gap-0.5 text-star">
            {Array.from({ length: RATING_MAX }, (_, index) => (
              <StarIcon key={index} className={iconClass} />
            ))}
          </span>
        </span>
      </span>

      {showValue && (
        <span className="text-sm font-semibold text-content-primary">{formatRating(rounded)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-caption text-content-muted">
          ({reviewCount})
        </span>
      )}
    </span>
  );
}
