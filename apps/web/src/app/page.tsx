import Link from 'next/link';
import { ArrowRight, GaugeCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { RATING_CATEGORY_LABELS, RATING_CATEGORY_SLUGS, vehicleFiltersSchema } from '@valauto/shared';
import { getPublicRepository } from '@/lib/data';
import { VehicleCard } from '@/components/catalog/vehicle-card';
import { VehicleGrid } from '@/components/catalog/vehicle-grid';
import { Reveal } from '@/components/ui/reveal';

// Home muda pouco: revalida de hora em hora (ISR) para o SEO ficar barato.
export const revalidate = 3600;

export default async function HomePage() {
  const repository = getPublicRepository();
  const highlights = await repository.listVehicles(
    vehicleFiltersSchema.parse({ sort: 'rating_desc', perPage: '12' }),
  );
  const topRated = highlights.items.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line-subtle">
        <div className="container-page flex flex-col items-center gap-6 py-token-2xl text-center">
          <span className="badge animate-fade-up border-accent-700/60 text-accent-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Avaliações de quem realmente dirige
          </span>

          <h1 className="max-w-4xl text-display font-bold leading-tight">
            Escolha seu próximo veículo com{' '}
            <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
              nota em cada categoria
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-content-secondary">
            Desempenho, conforto, segurança, economia e tecnologia — cada veículo recebe uma nota por
            categoria e uma média geral, calculadas a partir das opiniões publicadas pelos usuários.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/catalogo" className="btn-primary text-base">
              Explorar catálogo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/cadastro" className="btn-secondary text-base">
              Criar conta e avaliar
            </Link>
          </div>

          <ul className="mt-token-lg flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-content-muted">
            {RATING_CATEGORY_SLUGS.map((slug) => (
              <li key={slug} className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                {RATING_CATEGORY_LABELS[slug]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-token-2xl">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-h2 font-bold">Melhor avaliados</h2>
              <p className="text-content-secondary">
                Os veículos com a maior média geral entre todas as categorias.
              </p>
            </div>
            <Link href="/catalogo?sort=rating_desc" className="btn-ghost">
              Ver todos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <VehicleGrid animationKey="home-top-rated">
          {topRated.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </VehicleGrid>
      </section>

      <section className="container-page pb-token-2xl">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<GaugeCircle className="h-5 w-5" aria-hidden="true" />}
              title="Notas por categoria"
              description="Cada opinião pontua de 1 a 5 (com meia estrela) em cinco categorias, e a média geral vem dessas notas."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              title="Opinião verificada"
              description="Navegar e filtrar é livre. Publicar exige conta com e-mail confirmado — o que mantém a base confiável."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
              title="Pronto para crescer"
              description="Carros agora; motos e caminhões entram sem reescrever o catálogo, as categorias ou as buscas."
            />
          </div>
        </Reveal>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="surface flex flex-col gap-2 p-5">
      <span className="grid h-10 w-10 place-items-center rounded-token bg-accent-400/10 text-accent-300">
        {icon}
      </span>
      <h3 className="text-h3 font-semibold">{title}</h3>
      <p className="text-sm text-content-secondary">{description}</p>
    </div>
  );
}
