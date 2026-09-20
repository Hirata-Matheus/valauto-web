'use client';

import { useEffect, useId, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  PER_PAGE_OPTIONS,
  SORT_OPTIONS,
  countActiveFilters,
  formatRating,
  type Brand,
  type VehicleFilters,
} from '@valauto/shared';
import { cn } from '@/lib/utils';
import { useFilterParams } from '@/lib/use-filter-params';

const SEARCH_DEBOUNCE_MS = 350;

export function CatalogFilters({ brands }: { brands: Brand[] }) {
  const { filters, apply, reset, isPending } = useFilterParams();
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField value={filters.q ?? ''} onSearch={(q) => apply({ q: q || undefined })} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className={cn('btn-secondary', activeCount > 0 && 'border-accent-600 text-accent-300')}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeCount > 0 && (
              <span className="rounded-full bg-accent-400 px-1.5 text-caption font-bold text-content-inverse">
                {activeCount}
              </span>
            )}
          </button>

          <label className="sr-only" htmlFor={`${panelId}-sort`}>
            Ordenar por
          </label>
          <select
            id={`${panelId}-sort`}
            value={filters.sort}
            onChange={(event) =>
              apply({ sort: event.target.value as VehicleFilters['sort'] })
            }
            className="field w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        id={panelId}
        hidden={!isOpen}
        className="surface grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Montadora">
          <select
            value={filters.brand ?? ''}
            onChange={(event) => apply({ brand: event.target.value || undefined })}
            className="field"
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ano">
          <div className="flex items-center gap-2">
            <NumberInput
              aria-label="Ano mínimo"
              placeholder="De"
              value={filters.yearMin}
              onCommit={(value) => apply({ yearMin: value })}
            />
            <span className="text-content-muted" aria-hidden="true">
              –
            </span>
            <NumberInput
              aria-label="Ano máximo"
              placeholder="Até"
              value={filters.yearMax}
              onCommit={(value) => apply({ yearMax: value })}
            />
          </div>
        </Field>

        <Field label="Preço (R$)">
          <div className="flex items-center gap-2">
            <NumberInput
              aria-label="Preço mínimo"
              placeholder="De"
              value={filters.priceMin}
              onCommit={(value) => apply({ priceMin: value })}
            />
            <span className="text-content-muted" aria-hidden="true">
              –
            </span>
            <NumberInput
              aria-label="Preço máximo"
              placeholder="Até"
              value={filters.priceMax}
              onCommit={(value) => apply({ priceMax: value })}
            />
          </div>
        </Field>

        <RatingSlider
          value={filters.minRating ?? 0}
          onCommit={(value) => apply({ minRating: value > 0 ? value : undefined })}
        />

        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <Field label="Itens por página" className="w-40">
            <select
              value={filters.perPage}
              onChange={(event) => apply({ perPage: Number(event.target.value) })}
              className="field"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} por página
                </option>
              ))}
            </select>
          </Field>

          {activeCount > 0 && (
            <button type="button" onClick={reset} className="btn-ghost mb-0.5">
              <X className="h-4 w-4" aria-hidden="true" />
              Limpar filtros
            </button>
          )}

          <span className="mb-2 ml-auto text-caption text-content-muted" aria-live="polite">
            {isPending ? 'Atualizando…' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

/** Busca com debounce — evita uma navegacao por tecla digitada. */
function SearchField({ value, onSearch }: { value: string; onSearch: (value: string) => void }) {
  const [draft, setDraft] = useState(value);

  // Reflete mudancas vindas da URL (voltar/avancar, limpar filtros).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onSearch(draft.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `onSearch` muda a cada render do pai; incluí-lo reiniciaria o timer sempre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value]);

  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Buscar por marca ou modelo…"
        aria-label="Buscar por marca ou modelo"
        className="field pl-9"
      />
    </div>
  );
}

/** Input numerico que so aplica o filtro ao sair do campo ou no Enter. */
function NumberInput({
  value,
  onCommit,
  placeholder,
  ...rest
}: {
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
  placeholder?: string;
  'aria-label': string;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? '');

  useEffect(() => {
    setDraft(value?.toString() ?? '');
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onCommit(undefined);
      return;
    }
    const parsed = Number(trimmed);
    onCommit(Number.isFinite(parsed) ? parsed : undefined);
  }

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
      className="field"
    />
  );
}

/** Slider de nota minima; aplica no soltar para nao navegar a cada passo. */
function RatingSlider({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label className="block">
      <span className="label">
        Nota mínima:{' '}
        <strong className="text-accent-300">
          {draft > 0 ? `${formatRating(draft)} ★` : 'qualquer'}
        </strong>
      </span>
      <input
        type="range"
        min={0}
        max={5}
        step={0.5}
        value={draft}
        onChange={(event) => setDraft(Number(event.target.value))}
        onMouseUp={() => onCommit(draft)}
        onTouchEnd={() => onCommit(draft)}
        onKeyUp={() => onCommit(draft)}
        aria-label="Nota mínima"
        aria-valuetext={draft > 0 ? `${formatRating(draft)} estrelas` : 'qualquer nota'}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-base-700 accent-accent-400"
      />
    </label>
  );
}
