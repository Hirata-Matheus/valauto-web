'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseVehicleFilters, serializeVehicleFilters, type VehicleFilters } from '@valauto/shared';

/**
 * Filtros do catalogo espelhados na URL.
 *
 * A URL e a unica fonte de verdade: voltar/avancar no navegador funciona e o
 * link pode ser compartilhado com os filtros aplicados. Qualquer alteracao
 * (exceto a propria paginacao) volta para a pagina 1.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseVehicleFilters(new URLSearchParams(searchParams.toString()));

  const apply = useCallback(
    (patch: Partial<VehicleFilters>) => {
      const current = parseVehicleFilters(new URLSearchParams(searchParams.toString()));
      const next: Partial<VehicleFilters> = { ...current, ...patch };
      if (!('page' in patch)) next.page = 1;

      const query = serializeVehicleFilters(next).toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const reset = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return { filters, apply, reset, isPending };
}
