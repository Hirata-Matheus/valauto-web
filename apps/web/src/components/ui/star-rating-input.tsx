'use client';

import { useId, useState } from 'react';
import { RATING_MAX, RATING_STEP, formatRating } from '@valauto/shared';
import { cn } from '@/lib/utils';

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

interface StarRatingInputProps {
  name: string;
  /** Rotulo do grupo — vira a legend do fieldset. */
  label: string;
  description?: string | null;
  value: number | null;
  onChange: (value: number) => void;
  required?: boolean;
}

/**
 * Entrada de nota em meia estrela.
 *
 * Por baixo sao radio inputs nativos (10 opcoes de 0,5 a 5) dentro de um
 * fieldset: leitor de tela anuncia o grupo e as setas do teclado ja navegam
 * entre as notas sem JavaScript extra. Os labels desenham as metades clicaveis.
 */
export function StarRatingInput({
  name,
  label,
  description,
  value,
  onChange,
  required,
}: StarRatingInputProps) {
  const groupId = useId();
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayed = hoverValue ?? value ?? 0;
  const percentage = (displayed / RATING_MAX) * 100;

  const options = Array.from({ length: RATING_MAX / RATING_STEP }, (_, index) =>
    Number(((index + 1) * RATING_STEP).toFixed(1)),
  );

  return (
    <fieldset className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <legend className="text-sm font-medium text-content-primary">
          {label}
          {required && <span className="ml-1 text-status-danger" aria-hidden="true">*</span>}
        </legend>
        {description && <p className="text-caption text-content-muted">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="relative inline-flex"
          onMouseLeave={() => setHoverValue(null)}
        >
          {/* Camadas visuais */}
          <span className="inline-flex gap-1 text-line-strong" aria-hidden="true">
            {Array.from({ length: RATING_MAX }, (_, index) => (
              <StarIcon key={index} className="h-7 w-7" />
            ))}
          </span>
          <span
            className="pointer-events-none absolute inset-0 overflow-hidden transition-[width] duration-150"
            style={{ width: `${percentage}%` }}
            aria-hidden="true"
          >
            <span className="inline-flex gap-1 text-accent-400">
              {Array.from({ length: RATING_MAX }, (_, index) => (
                <StarIcon key={index} className="h-7 w-7" />
              ))}
            </span>
          </span>

          {/* Controles reais: radios invisiveis + metades clicaveis */}
          <div className="absolute inset-0 flex">
            {options.map((option) => {
              const optionId = `${groupId}-${option}`;
              return (
                <div key={option} className="relative h-full flex-1">
                  <input
                    type="radio"
                    id={optionId}
                    name={name}
                    value={option}
                    checked={value === option}
                    onChange={() => onChange(option)}
                    onFocus={() => setHoverValue(option)}
                    onBlur={() => setHoverValue(null)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={optionId}
                    onMouseEnter={() => setHoverValue(option)}
                    className={cn(
                      'block h-full w-full cursor-pointer rounded-sm',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-400',
                    )}
                  >
                    <span className="sr-only">{`${formatRating(option)} de ${RATING_MAX} em ${label}`}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <span
          className="w-8 text-sm font-semibold tabular-nums text-content-secondary"
          aria-live="polite"
        >
          {value === null ? '—' : formatRating(value)}
        </span>
      </div>
    </fieldset>
  );
}
