import { z } from 'zod';
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  REVIEW_COMMENT_MAX_LENGTH,
  SORT_OPTIONS,
  VEHICLE_TYPES,
} from './constants';

/** Nota de 1 a 5 em passos de 0,5. */
export const ratingScoreSchema = z
  .number()
  .min(RATING_MIN, `A nota mínima é ${RATING_MIN}`)
  .max(RATING_MAX, `A nota máxima é ${RATING_MAX}`)
  .refine((value) => Number.isInteger(value / RATING_STEP), {
    message: 'Use incrementos de meia estrela',
  });

/** Coerce que trata string vazia como ausente — o catalogo le tudo da URL. */
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional(),
);

const sortValues = SORT_OPTIONS.map((option) => option.value) as [string, ...string[]];

/** Filtros do catalogo — mesmo schema usado na URL, na rota de API e no client. */
export const vehicleFiltersSchema = z.object({
  /** Busca por marca/modelo. */
  q: z.string().trim().max(80).optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  brand: z.string().trim().max(80).optional(),
  yearMin: optionalNumber.pipe(z.number().int().min(1900).max(2100).optional()),
  yearMax: optionalNumber.pipe(z.number().int().min(1900).max(2100).optional()),
  priceMin: optionalNumber.pipe(z.number().min(0).optional()),
  priceMax: optionalNumber.pipe(z.number().min(0).optional()),
  minRating: optionalNumber.pipe(z.number().min(0).max(RATING_MAX).optional()),
  sort: z.enum(sortValues).default('rating_desc'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (PER_PAGE_OPTIONS as readonly number[]).includes(value))
    .catch(DEFAULT_PER_PAGE)
    .default(DEFAULT_PER_PAGE),
});

export type VehicleFiltersInput = z.input<typeof vehicleFiltersSchema>;
export type VehicleFilters = z.output<typeof vehicleFiltersSchema>;

/** Payload de publicacao/edicao de opiniao. */
export const reviewInputSchema = z.object({
  vehicleId: z.string().uuid('Veículo inválido'),
  ratings: z
    .array(
      z.object({
        categoryId: z.string().uuid(),
        score: ratingScoreSchema,
      }),
    )
    .min(1, 'Avalie ao menos uma categoria'),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX_LENGTH, `Máximo de ${REVIEW_COMMENT_MAX_LENGTH} caracteres`)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewReportSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().trim().min(5, 'Descreva o motivo').max(500),
});

export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

/** Sugestao de veiculo ausente do catalogo (Fase 3, schema ja compartilhado). */
export const suggestionInputSchema = z.object({
  brandName: z.string().trim().min(2, 'Informe a montadora').max(60),
  model: z.string().trim().min(1, 'Informe o modelo').max(80),
  type: z.enum(VEHICLE_TYPES),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type SuggestionInput = z.infer<typeof suggestionInputSchema>;

// --- Autenticacao -----------------------------------------------------------

const passwordSchema = z
  .string()
  .min(8, 'A senha precisa de ao menos 8 caracteres')
  .max(72, 'A senha é longa demais')
  .regex(/[a-zA-Z]/, 'Inclua ao menos uma letra')
  .regex(/[0-9]/, 'Inclua ao menos um número');

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(60),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
