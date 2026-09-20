import {
  RATING_CATEGORY_LABELS,
  RATING_CATEGORY_SLUGS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  roundToHalf,
  summarizeVehicleReviews,
  type Brand,
  type RatingCategory,
  type Review,
  type Vehicle,
  type VehicleSpecs,
  type VehicleType,
} from '@valauto/shared';

/**
 * Dataset de desenvolvimento, espelhando supabase/seed.sql.
 *
 * Serve ao repositorio em memoria para que o catalogo e o detalhe fiquem
 * navegaveis antes de existir um projeto Supabase. As reviews sao geradas de
 * forma deterministica (mesmo seed => mesmas notas) para que as medias sejam
 * estaveis entre reloads e entre SSR e client.
 */

/** UUID deterministico e valido a partir de um indice. */
function uuid(prefix: number, index: number): string {
  const tail = String(index).padStart(12, '0');
  return `${String(prefix).padStart(8, '0')}-0000-4000-8000-${tail}`;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  desempenho: 'Potência, retomada e comportamento dinâmico.',
  conforto: 'Acabamento, espaço interno, ruído e suspensão.',
  seguranca: 'Itens de série, estabilidade e resultados de crash test.',
  economia: 'Consumo, manutenção e custo de uso no dia a dia.',
  tecnologia: 'Multimídia, conectividade e assistentes de condução.',
};

export const seedVehicleTypes: VehicleType[] = VEHICLE_TYPES.map((slug, index) => ({
  slug,
  label: VEHICLE_TYPE_LABELS[slug],
  position: index + 1,
}));

export const seedRatingCategories: RatingCategory[] = RATING_CATEGORY_SLUGS.map((slug, index) => ({
  id: uuid(1, index + 1),
  slug,
  name: RATING_CATEGORY_LABELS[slug],
  description: CATEGORY_DESCRIPTIONS[slug] ?? null,
  appliesTo: [],
  position: index + 1,
}));

const BRAND_SEED: { name: string; slug: string; country: string }[] = [
  { name: 'Toyota', slug: 'toyota', country: 'Japão' },
  { name: 'Honda', slug: 'honda', country: 'Japão' },
  { name: 'Volkswagen', slug: 'volkswagen', country: 'Alemanha' },
  { name: 'Chevrolet', slug: 'chevrolet', country: 'Estados Unidos' },
  { name: 'Hyundai', slug: 'hyundai', country: 'Coreia do Sul' },
  { name: 'Fiat', slug: 'fiat', country: 'Itália' },
  { name: 'Jeep', slug: 'jeep', country: 'Estados Unidos' },
  { name: 'BYD', slug: 'byd', country: 'China' },
];

export const seedBrands: Brand[] = BRAND_SEED.map((brand, index) => ({
  id: uuid(2, index + 1),
  name: brand.name,
  slug: brand.slug,
  logoUrl: null,
  country: brand.country,
}));

const brandBySlug = new Map(seedBrands.map((brand) => [brand.slug, brand]));

interface VehicleSeed {
  slug: string;
  brandSlug: string;
  model: string;
  year: number;
  price: number;
  shortDescription: string;
  specs: VehicleSpecs;
  /** Nota-alvo por categoria; as reviews sao geradas ao redor destes valores. */
  target: Partial<Record<(typeof RATING_CATEGORY_SLUGS)[number], number>>;
  reviewCount: number;
}

const VEHICLE_SEED: VehicleSeed[] = [
  {
    slug: 'toyota-corolla-2024',
    brandSlug: 'toyota',
    model: 'Corolla',
    year: 2024,
    price: 164990,
    shortDescription: 'Sedã médio com foco em confiabilidade e consumo equilibrado.',
    specs: {
      powerHp: 177,
      fuelConsumptionKmL: 13.8,
      acceleration0to100s: 9.2,
      seats: 5,
      trunkLiters: 470,
    },
    target: { desempenho: 4, conforto: 4.5, seguranca: 4.5, economia: 4.5, tecnologia: 4 },
    reviewCount: 18,
  },
  {
    slug: 'toyota-corolla-cross-2024',
    brandSlug: 'toyota',
    model: 'Corolla Cross',
    year: 2024,
    price: 199990,
    shortDescription: 'SUV híbrido derivado do Corolla, com boa altura livre do solo.',
    specs: {
      powerHp: 122,
      fuelConsumptionKmL: 16.2,
      acceleration0to100s: 10.7,
      seats: 5,
      trunkLiters: 440,
    },
    target: { desempenho: 3.5, conforto: 4.5, seguranca: 4.5, economia: 5, tecnologia: 4 },
    reviewCount: 14,
  },
  {
    slug: 'honda-civic-2024',
    brandSlug: 'honda',
    model: 'Civic',
    year: 2024,
    price: 249900,
    shortDescription: 'Sedã esportivo com trem de força híbrido e acabamento refinado.',
    specs: {
      powerHp: 200,
      fuelConsumptionKmL: 17,
      acceleration0to100s: 7.9,
      seats: 5,
      trunkLiters: 409,
    },
    target: { desempenho: 5, conforto: 4.5, seguranca: 4.5, economia: 4.5, tecnologia: 4.5 },
    reviewCount: 23,
  },
  {
    slug: 'honda-hr-v-2023',
    brandSlug: 'honda',
    model: 'HR-V',
    year: 2023,
    price: 159900,
    shortDescription: 'SUV compacto com espaço interno acima da média da categoria.',
    specs: {
      powerHp: 126,
      fuelConsumptionKmL: 12.9,
      acceleration0to100s: 11.4,
      seats: 5,
      trunkLiters: 354,
    },
    target: { desempenho: 3.5, conforto: 4.5, seguranca: 4, economia: 4, tecnologia: 3.5 },
    reviewCount: 11,
  },
  {
    slug: 'volkswagen-t-cross-2024',
    brandSlug: 'volkswagen',
    model: 'T-Cross',
    year: 2024,
    price: 154990,
    shortDescription: 'SUV urbano com motor turbo e pacote de assistentes de condução.',
    specs: {
      powerHp: 128,
      fuelConsumptionKmL: 12.4,
      acceleration0to100s: 10.4,
      seats: 5,
      trunkLiters: 373,
    },
    target: { desempenho: 4, conforto: 4, seguranca: 4.5, economia: 3.5, tecnologia: 4.5 },
    reviewCount: 16,
  },
  {
    slug: 'volkswagen-polo-2023',
    brandSlug: 'volkswagen',
    model: 'Polo',
    year: 2023,
    price: 98990,
    shortDescription: 'Hatch compacto com boa estrutura e opções turbo.',
    specs: {
      powerHp: 116,
      fuelConsumptionKmL: 13.1,
      acceleration0to100s: 10,
      seats: 5,
      trunkLiters: 300,
    },
    target: { desempenho: 4, conforto: 3.5, seguranca: 4.5, economia: 4, tecnologia: 3.5 },
    reviewCount: 9,
  },
  {
    slug: 'chevrolet-onix-2024',
    brandSlug: 'chevrolet',
    model: 'Onix',
    year: 2024,
    price: 94990,
    shortDescription: 'Hatch de entrada com motor 1.0 turbo e central multimídia completa.',
    specs: {
      powerHp: 116,
      fuelConsumptionKmL: 13.9,
      acceleration0to100s: 10.3,
      seats: 5,
      trunkLiters: 275,
    },
    target: { desempenho: 3.5, conforto: 3.5, seguranca: 4, economia: 4.5, tecnologia: 4 },
    reviewCount: 27,
  },
  {
    slug: 'chevrolet-tracker-2024',
    brandSlug: 'chevrolet',
    model: 'Tracker',
    year: 2024,
    price: 139990,
    shortDescription: 'SUV compacto com pacote de segurança robusto de série.',
    specs: {
      powerHp: 133,
      fuelConsumptionKmL: 12.2,
      acceleration0to100s: 10.6,
      seats: 5,
      trunkLiters: 393,
    },
    target: { desempenho: 4, conforto: 4, seguranca: 4.5, economia: 3.5, tecnologia: 4 },
    reviewCount: 13,
  },
  {
    slug: 'hyundai-hb20-2024',
    brandSlug: 'hyundai',
    model: 'HB20',
    year: 2024,
    price: 89990,
    shortDescription: 'Hatch econômico com boa relação custo-benefício.',
    specs: {
      powerHp: 120,
      fuelConsumptionKmL: 13.5,
      acceleration0to100s: 10.8,
      seats: 5,
      trunkLiters: 300,
    },
    target: { desempenho: 3.5, conforto: 3.5, seguranca: 4, economia: 4.5, tecnologia: 3.5 },
    reviewCount: 21,
  },
  {
    slug: 'hyundai-creta-2024',
    brandSlug: 'hyundai',
    model: 'Creta',
    year: 2024,
    price: 169990,
    shortDescription: 'SUV médio com interior espaçoso e bom isolamento acústico.',
    specs: {
      powerHp: 130,
      fuelConsumptionKmL: 11.8,
      acceleration0to100s: 10.1,
      seats: 5,
      trunkLiters: 422,
    },
    target: { desempenho: 4, conforto: 4.5, seguranca: 4, economia: 3.5, tecnologia: 4.5 },
    reviewCount: 15,
  },
  {
    slug: 'fiat-pulse-2024',
    brandSlug: 'fiat',
    model: 'Pulse',
    year: 2024,
    price: 119990,
    shortDescription: 'SUV compacto nacional com motor turbo de três cilindros.',
    specs: {
      powerHp: 130,
      fuelConsumptionKmL: 12,
      acceleration0to100s: 9.8,
      seats: 5,
      trunkLiters: 370,
    },
    target: { desempenho: 4, conforto: 3.5, seguranca: 4, economia: 3.5, tecnologia: 4 },
    reviewCount: 10,
  },
  {
    slug: 'fiat-argo-2023',
    brandSlug: 'fiat',
    model: 'Argo',
    year: 2023,
    price: 84990,
    shortDescription: 'Hatch de entrada com custo de manutenção baixo.',
    specs: {
      powerHp: 77,
      fuelConsumptionKmL: 13.2,
      acceleration0to100s: 13,
      seats: 5,
      trunkLiters: 300,
    },
    target: { desempenho: 2.5, conforto: 3, seguranca: 3.5, economia: 4.5, tecnologia: 3 },
    reviewCount: 8,
  },
  {
    slug: 'jeep-compass-2024',
    brandSlug: 'jeep',
    model: 'Compass',
    year: 2024,
    price: 209990,
    shortDescription: 'SUV médio com tração 4x4 disponível e forte apelo off-road.',
    specs: {
      powerHp: 185,
      fuelConsumptionKmL: 10.6,
      acceleration0to100s: 8.9,
      seats: 5,
      trunkLiters: 467,
    },
    target: { desempenho: 4.5, conforto: 4.5, seguranca: 4.5, economia: 3, tecnologia: 4.5 },
    reviewCount: 19,
  },
  {
    slug: 'jeep-renegade-2023',
    brandSlug: 'jeep',
    model: 'Renegade',
    year: 2023,
    price: 149990,
    shortDescription: 'SUV compacto com postura robusta e boa dirigibilidade urbana.',
    specs: {
      powerHp: 185,
      fuelConsumptionKmL: 10.9,
      acceleration0to100s: 9.4,
      seats: 5,
      trunkLiters: 320,
    },
    target: { desempenho: 4, conforto: 4, seguranca: 4, economia: 3, tecnologia: 4 },
    reviewCount: 12,
  },
  {
    slug: 'byd-dolphin-2024',
    brandSlug: 'byd',
    model: 'Dolphin',
    year: 2024,
    price: 149800,
    shortDescription: 'Hatch 100% elétrico com carregamento rápido e boa autonomia urbana.',
    specs: {
      powerHp: 95,
      acceleration0to100s: 12.3,
      seats: 5,
      trunkLiters: 345,
    },
    target: { desempenho: 3.5, conforto: 4, seguranca: 4, economia: 5, tecnologia: 5 },
    reviewCount: 17,
  },
  {
    slug: 'byd-song-plus-2024',
    brandSlug: 'byd',
    model: 'Song Plus',
    year: 2024,
    price: 239800,
    shortDescription: 'SUV híbrido plug-in com autonomia elétrica para o uso diário.',
    specs: {
      powerHp: 235,
      fuelConsumptionKmL: 18.5,
      acceleration0to100s: 8.5,
      seats: 5,
      trunkLiters: 574,
    },
    target: { desempenho: 4.5, conforto: 4.5, seguranca: 4, economia: 5, tecnologia: 5 },
    reviewCount: 6,
  },
];

const REVIEWER_NAMES = [
  'Ana Martins',
  'Bruno Carvalho',
  'Carla Ribeiro',
  'Diego Almeida',
  'Eduarda Lima',
  'Felipe Nogueira',
  'Gabriela Souza',
  'Henrique Dias',
  'Isabela Rocha',
  'João Pedro Alves',
  'Karina Menezes',
  'Lucas Ferreira',
];

const REVIEW_COMMENTS = [
  'Uso no dia a dia da cidade e não tenho do que reclamar. Consumo dentro do esperado.',
  'Rodei mais de 10 mil km em estrada. Estável e silencioso na velocidade de cruzeiro.',
  'Acabamento interno poderia ser melhor pelo preço, mas o conjunto mecânico entrega.',
  'Multimídia é o ponto alto. Conecta rápido e não trava.',
  'Espaço no banco de trás é justo para três adultos.',
  'Manutenção na concessionária sai cara, mas as revisões são espaçadas.',
  null,
  'Troquei de um modelo mais antigo e a diferença em segurança é enorme.',
  null,
  'Porta-malas resolve bem para viagem de família.',
];

/** PRNG deterministico (mulberry32) — mesma seed, mesma sequencia. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReviews(vehicleId: string, seed: VehicleSeed, vehicleIndex: number): Review[] {
  const random = createRandom(vehicleIndex * 7919 + 13);
  const reviews: Review[] = [];

  for (let i = 0; i < seed.reviewCount; i += 1) {
    const ratings = seedRatingCategories.map((category) => {
      const target = seed.target[category.slug as keyof typeof seed.target] ?? 3.5;
      // Dispersao de +-1 estrela ao redor da nota-alvo.
      const deviation = (random() - 0.5) * 2;
      const score = Math.min(5, Math.max(1, roundToHalf(target + deviation)));
      return { categoryId: category.id, categorySlug: category.slug, score };
    });

    const overall =
      Math.round(
        (ratings.reduce((acc, rating) => acc + rating.score, 0) / ratings.length) * 10,
      ) / 10;

    const nameIndex = Math.floor(random() * REVIEWER_NAMES.length);
    const commentIndex = Math.floor(random() * REVIEW_COMMENTS.length);
    // Datas decrescentes e estaveis (nao dependem do relogio).
    const createdAt = new Date(Date.UTC(2026, 0, 1) - i * 86_400_000 * 3).toISOString();

    reviews.push({
      id: uuid(4, vehicleIndex * 100 + i + 1),
      vehicleId,
      author: {
        id: uuid(5, nameIndex + 1),
        name: REVIEWER_NAMES[nameIndex] ?? 'Usuário ValAuto',
        avatarUrl: null,
      },
      ratings,
      overall,
      comment: REVIEW_COMMENTS[commentIndex] ?? null,
      status: 'published',
      createdAt,
      updatedAt: createdAt,
    });
  }

  return reviews;
}

const vehicles: Vehicle[] = [];
const reviewsByVehicle = new Map<string, Review[]>();

VEHICLE_SEED.forEach((seed, index) => {
  const id = uuid(3, index + 1);
  const brand = brandBySlug.get(seed.brandSlug);
  if (!brand) throw new Error(`Marca não encontrada no seed: ${seed.brandSlug}`);

  const reviews = buildReviews(id, seed, index + 1);
  reviewsByVehicle.set(id, reviews);

  vehicles.push({
    id,
    slug: seed.slug,
    brand,
    model: seed.model,
    type: 'carro',
    year: seed.year,
    price: seed.price,
    shortDescription: seed.shortDescription,
    description: seed.shortDescription,
    images: [],
    specs: seed.specs,
    summary: summarizeVehicleReviews(id, reviews),
    createdAt: '2026-01-01T00:00:00.000Z',
  });
});

export const seedVehicles: Vehicle[] = vehicles;
export const seedReviews: Map<string, Review[]> = reviewsByVehicle;
