import type { SpecFieldMeta } from './types';

/**
 * Catalogo de specs conhecidas. Cada campo declara a que tipos se aplica e se
 * "maior e melhor" — o detalhe do veiculo usa isso para rotular/formatar e o
 * comparador (Fase 2) usa para decidir quem vence cada linha.
 */
export const SPEC_FIELDS: readonly SpecFieldMeta[] = [
  { key: 'powerHp', label: 'Potência', unit: 'cv', higherIsBetter: true, appliesTo: [] },
  {
    key: 'fuelConsumptionKmL',
    label: 'Consumo médio',
    unit: 'km/l',
    higherIsBetter: true,
    appliesTo: [],
  },
  {
    key: 'acceleration0to100s',
    label: '0–100 km/h',
    unit: 's',
    higherIsBetter: false,
    appliesTo: [],
  },
  { key: 'seats', label: 'Lugares', unit: '', higherIsBetter: true, appliesTo: ['carro'] },
  {
    key: 'trunkLiters',
    label: 'Porta-malas',
    unit: 'L',
    higherIsBetter: true,
    appliesTo: ['carro'],
  },
  { key: 'engineCc', label: 'Cilindrada', unit: 'cm³', higherIsBetter: true, appliesTo: ['moto'] },
  { key: 'weightKg', label: 'Peso', unit: 'kg', higherIsBetter: false, appliesTo: ['moto'] },
  {
    key: 'payloadKg',
    label: 'Capacidade de carga',
    unit: 'kg',
    higherIsBetter: true,
    appliesTo: ['caminhao'],
  },
  { key: 'axles', label: 'Eixos', unit: '', higherIsBetter: true, appliesTo: ['caminhao'] },
];

/** Specs aplicaveis a um tipo de veiculo (campos sem `appliesTo` valem para todos). */
export function specFieldsForType(type: string): SpecFieldMeta[] {
  return SPEC_FIELDS.filter(
    (field) => field.appliesTo.length === 0 || field.appliesTo.includes(type),
  );
}

export function findSpecField(key: string): SpecFieldMeta | undefined {
  return SPEC_FIELDS.find((field) => field.key === key);
}
