const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return BRL.format(value);
}

/** Preco compacto usado nos sliders/labels de filtro (ex.: "R$ 120 mil"). */
export function formatPriceCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${NUMBER.format(value / 1_000_000)} mi`;
  if (value >= 1000) return `R$ ${NUMBER.format(Math.round(value / 1000))} mil`;
  return BRL.format(value);
}

export function formatSpec(value: number | string | undefined, unit: string): string {
  if (value === undefined || value === null || value === '') return '—';
  const formatted = typeof value === 'number' ? NUMBER.format(value) : value;
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${NUMBER.format(count)} ${count === 1 ? singular : plural}`;
}

/** Slug estavel para URLs de veiculo (marca-modelo-ano). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
