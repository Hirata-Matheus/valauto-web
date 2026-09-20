'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterParams } from '@/lib/use-filter-params';

/** Janela de paginas ao redor da atual, sempre com a primeira e a ultima. */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const page = current + offset;
    if (page > 1 && page < total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('gap');
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { apply } = useFilterParams();
  if (totalPages <= 1) return null;

  function goTo(target: number) {
    apply({ page: Math.min(Math.max(1, target), totalPages) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Paginação do catálogo">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="btn-secondary px-3"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pageWindow(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-2 text-content-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Página ${item}`}
            className={cn(
              'btn min-w-10',
              item === page
                ? 'bg-accent-400 text-content-inverse'
                : 'text-content-secondary hover:bg-base-800',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary px-3"
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
