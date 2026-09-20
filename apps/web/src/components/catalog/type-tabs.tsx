'use client';

import type { VehicleFilters, VehicleType } from '@valauto/shared';
import { cn } from '@/lib/utils';
import { useFilterParams } from '@/lib/use-filter-params';

/** Abas por tipo de veiculo (Todos / Carro / Moto / Caminhão). */
export function TypeTabs({ types }: { types: VehicleType[] }) {
  const { filters, apply } = useFilterParams();
  const active = filters.type ?? '';

  const options = [{ slug: '', label: 'Todos' }, ...types];

  return (
    <div
      role="tablist"
      aria-label="Filtrar por tipo de veículo"
      className="flex flex-wrap gap-1 rounded-token border border-line-subtle bg-base-900/60 p-1"
    >
      {options.map((option) => {
        const isActive = active === option.slug;
        return (
          <button
            key={option.slug || 'todos'}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => apply({ type: (option.slug || undefined) as VehicleFilters['type'] })}
            className={cn(
              'rounded-token px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent-400 text-content-inverse shadow-glow-sm'
                : 'text-content-secondary hover:bg-base-800 hover:text-content-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
