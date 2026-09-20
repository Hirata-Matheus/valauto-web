import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { parseVehicleFilters, pluralize } from '@valauto/shared';
import { getPublicRepository } from '@/lib/data';
import { CatalogFilters } from '@/components/catalog/catalog-filters';
import { TypeTabs } from '@/components/catalog/type-tabs';
import { VehicleCard } from '@/components/catalog/vehicle-card';
import { VehicleGrid } from '@/components/catalog/vehicle-grid';
import { Pagination } from '@/components/catalog/pagination';

export const metadata: Metadata = {
  title: 'Catálogo de veículos',
  description:
    'Filtre por marca, modelo, ano, preço e nota mínima. Compare avaliações reais antes de decidir.',
};

// Os filtros vem da URL, entao a pagina e dinamica; o cache de dados fica por
// conta do fetch/ISR das consultas individuais.
export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const filters = parseVehicleFilters(params);

  const repository = getPublicRepository();
  const [result, brands, types] = await Promise.all([
    repository.listVehicles(filters),
    repository.listBrands(),
    repository.listVehicleTypes(),
  ]);

  // Muda quando o conjunto exibido muda — reinicia o stagger dos cards.
  const animationKey = `${filters.type ?? 'todos'}-${filters.sort}-${result.page}-${filters.q ?? ''}`;

  return (
    <div className="container-page py-token-xl">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-h1 font-bold">Avaliação de Veículos</h1>
        <p className="max-w-2xl text-content-secondary">
          Notas por desempenho, conforto, segurança, economia e tecnologia — calculadas a partir das
          opiniões de quem dirige.
        </p>
      </header>

      <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
        <div className="mb-6 flex flex-col gap-4">
          <TypeTabs types={types} />
          <CatalogFilters brands={brands} />
        </div>

        <p className="mb-4 text-sm text-content-muted" aria-live="polite">
          {result.total === 0
            ? 'Nenhum veículo encontrado'
            : `${pluralize(result.total, 'veículo encontrado', 'veículos encontrados')}`}
        </p>

        {result.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <VehicleGrid animationKey={animationKey}>
              {result.items.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </VehicleGrid>

            <div className="mt-token-xl">
              <Pagination page={result.page} totalPages={result.totalPages} />
            </div>
          </>
        )}
      </Suspense>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
      <SearchX className="h-10 w-10 text-content-muted" aria-hidden="true" />
      <h2 className="text-h3 font-semibold">Nenhum veículo com esses filtros</h2>
      <p className="max-w-md text-sm text-content-secondary">
        Tente ampliar a faixa de preço ou de ano, ou reduzir a nota mínima exigida.
      </p>
    </div>
  );
}
