import Link from 'next/link';
import { Gauge, Fuel, Timer } from 'lucide-react';
import {
  VEHICLE_TYPE_LABELS,
  formatPrice,
  formatSpec,
  type Vehicle,
  type VehicleTypeSlug,
} from '@valauto/shared';
import { GlowCard } from '@/components/ui/glow-card';
import { StarRating } from '@/components/ui/star-rating';

/** Iniciais usadas no placeholder enquanto o veiculo nao tem foto cadastrada. */
function initials(vehicle: Vehicle): string {
  return vehicle.model
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeSlug] ?? vehicle.type;
  const cover = vehicle.images[0];

  return (
    <GlowCard as="article" className="h-full">
      <Link
        href={`/veiculos/${vehicle.slug}`}
        className="flex h-full flex-col rounded-token-lg focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-token-lg bg-base-800">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`${vehicle.brand.name} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/glow:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-base-700 to-base-850"
              aria-hidden="true"
            >
              <span className="text-4xl font-bold text-accent-400/30">{initials(vehicle)}</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex gap-2">
            <span className="badge bg-base-950/80">{typeLabel}</span>
            <span className="badge bg-base-950/80">{vehicle.year}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-caption uppercase tracking-wide text-content-muted">
              {vehicle.brand.name}
            </p>
            <h3 className="text-h3 font-semibold leading-tight text-content-primary">
              {vehicle.model}
            </h3>
          </div>

          <StarRating
            value={vehicle.summary.overallAverage}
            showValue
            reviewCount={vehicle.summary.reviewCount}
          />

          {vehicle.shortDescription && (
            <p className="line-clamp-2 text-sm text-content-secondary">
              {vehicle.shortDescription}
            </p>
          )}

          <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line-subtle pt-3 text-caption">
            <div>
              <dt className="flex items-center gap-1 text-content-muted">
                <Gauge className="h-3 w-3" aria-hidden="true" />
                Potência
              </dt>
              <dd className="font-medium text-content-primary">
                {formatSpec(vehicle.specs.powerHp, 'cv')}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-content-muted">
                <Fuel className="h-3 w-3" aria-hidden="true" />
                Consumo
              </dt>
              <dd className="font-medium text-content-primary">
                {formatSpec(vehicle.specs.fuelConsumptionKmL, 'km/l')}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-content-muted">
                <Timer className="h-3 w-3" aria-hidden="true" />
                0–100
              </dt>
              <dd className="font-medium text-content-primary">
                {formatSpec(vehicle.specs.acceleration0to100s, 's')}
              </dd>
            </div>
          </dl>

          <p className="text-lg font-bold text-accent-300">{formatPrice(vehicle.price)}</p>
        </div>
      </Link>
    </GlowCard>
  );
}
