import { formatSpec, specFieldsForType, type Vehicle } from '@valauto/shared';

/**
 * Ficha tecnica. Os campos exibidos vem de specFieldsForType(), entao um tipo
 * novo (moto, caminhao) mostra as proprias specs sem alterar este componente.
 */
export function SpecList({ vehicle }: { vehicle: Vehicle }) {
  const fields = specFieldsForType(vehicle.type).filter(
    (field) => vehicle.specs[field.key] !== undefined,
  );

  if (fields.length === 0) {
    return (
      <p className="text-sm text-content-muted">
        Ficha técnica ainda não cadastrada para este veículo.
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {fields.map((field) => (
        <div key={field.key} className="rounded-token border border-line-subtle bg-base-900/50 p-3">
          <dt className="text-caption text-content-muted">{field.label}</dt>
          <dd className="text-base font-semibold text-content-primary">
            {formatSpec(vehicle.specs[field.key], field.unit)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
