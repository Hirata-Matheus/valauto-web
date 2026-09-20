import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import {
  VEHICLE_TYPE_LABELS,
  formatPrice,
  formatRating,
  pluralize,
  type Vehicle,
  type VehicleTypeSlug,
} from '@valauto/shared';
import { getRepository } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { StarRating } from '@/components/ui/star-rating';
import { CategoryRatings } from '@/components/vehicle/category-ratings';
import { SpecList } from '@/components/vehicle/spec-list';
import { ReviewList } from '@/components/vehicle/review-list';
import { ReviewSection } from '@/components/vehicle/review-section';

/**
 * ISR: a pagina e gerada estaticamente e revalidada a cada 10 minutos.
 *
 * Nada aqui le cookie — a sessao fica nas ilhas client (ReviewSection e o
 * header). Fosse lida no servidor, a rota viraria dinamica e perderia o ISR.
 */
export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-renderiza os veiculos existentes; novos slugs entram sob demanda. */
export async function generateStaticParams() {
  const repository = await getRepository();
  const slugs = await repository.listVehicleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = await getRepository();
  const vehicle = await repository.getVehicleBySlug(slug);

  if (!vehicle) return { title: 'Veículo não encontrado' };

  const name = `${vehicle.brand.name} ${vehicle.model} ${vehicle.year}`;
  const rating = vehicle.summary.overallAverage;
  const description =
    vehicle.shortDescription ??
    `Avaliações, ficha técnica e notas por categoria do ${name} no ValAuto.`;

  return {
    title: name,
    description:
      rating === null
        ? description
        : `${description} Nota geral ${formatRating(rating)} em ${vehicle.summary.reviewCount} avaliações.`,
    alternates: { canonical: `${siteUrl}/veiculos/${vehicle.slug}` },
    openGraph: {
      title: name,
      description,
      url: `${siteUrl}/veiculos/${vehicle.slug}`,
      images: vehicle.images[0] ? [vehicle.images[0]] : undefined,
    },
  };
}

export default async function VehiclePage({ params }: PageProps) {
  const { slug } = await params;
  const repository = await getRepository();

  const vehicle = await repository.getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const [categories, reviews] = await Promise.all([
    repository.listRatingCategories(vehicle.type),
    repository.listReviews(vehicle.id),
  ]);

  const typeLabel = VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeSlug] ?? vehicle.type;
  const name = `${vehicle.brand.name} ${vehicle.model}`;

  return (
    <div className="container-page py-token-xl">
      <Link href="/catalogo" className="btn-ghost mb-4 -ml-2">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao catálogo
      </Link>

      <article className="grid gap-token-xl lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-token-lg">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge">{typeLabel}</span>
              <span className="badge">{vehicle.year}</span>
              <span className="badge">{vehicle.brand.name}</span>
            </div>

            <h1 className="text-h1 font-bold">
              {name} <span className="text-content-muted">{vehicle.year}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <StarRating value={vehicle.summary.overallAverage} size="lg" showValue />
              <span className="text-sm text-content-secondary">
                {vehicle.summary.reviewCount === 0
                  ? 'Sem avaliações ainda'
                  : pluralize(vehicle.summary.reviewCount, 'avaliação', 'avaliações')}
              </span>
              <span className="ml-auto text-h2 font-bold text-accent-300">
                {formatPrice(vehicle.price)}
              </span>
            </div>

            {vehicle.description && <p className="text-content-secondary">{vehicle.description}</p>}
          </header>

          <section aria-labelledby="ficha-tecnica" className="flex flex-col gap-3">
            <h2 id="ficha-tecnica" className="text-h2 font-bold">
              Ficha técnica
            </h2>
            <SpecList vehicle={vehicle} />
          </section>

          <section aria-labelledby="opinioes" className="flex flex-col gap-4">
            <h2 id="opinioes" className="text-h2 font-bold">
              Opiniões
            </h2>
            <ReviewSection
              vehicleId={vehicle.id}
              vehicleSlug={vehicle.slug}
              categories={categories}
            />
            <ReviewList reviews={reviews} categories={categories} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-h3 font-semibold">Notas por categoria</h2>
              <p className="text-caption text-content-muted">
                Média das opiniões publicadas, por categoria.
              </p>
            </div>
            <CategoryRatings categories={categories} summary={vehicle.summary} />
          </div>
        </aside>
      </article>

      <StructuredData vehicle={vehicle} name={name} />
    </div>
  );
}

/** schema.org Product + AggregateRating — habilita rich snippet com estrelas. */
function StructuredData({ vehicle, name }: { vehicle: Vehicle; name: string }) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${name} ${vehicle.year}`,
    brand: { '@type': 'Brand', name: vehicle.brand.name },
    description: vehicle.shortDescription ?? undefined,
    image: vehicle.images.length > 0 ? vehicle.images : undefined,
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/veiculos/${vehicle.slug}`,
    },
  };

  if (vehicle.summary.overallAverage !== null && vehicle.summary.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: vehicle.summary.overallAverage,
      reviewCount: vehicle.summary.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      // JSON gerado no servidor a partir de dados proprios do catalogo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
