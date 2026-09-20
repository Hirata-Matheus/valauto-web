/**
 * Tokens de design do ValAuto.
 *
 * Fonte unica de verdade para cores/espacamento/tipografia. O web consome via
 * preset do Tailwind (tailwind-preset.cjs) e o mobile vai consumir os mesmos
 * valores via NativeWind, evitando divergencia visual entre as plataformas.
 */

/** Tema escuro por padrao: fundo verde quase preto, acentos teal. */
export const colors = {
  /** Fundos, do mais profundo ao mais elevado. */
  base: {
    950: '#04110d',
    900: '#071a14',
    850: '#0a211a',
    800: '#0e2a21',
    700: '#14382c',
    600: '#1c4a3a',
  },
  /** Acento primario (botoes, links ativos, estrelas preenchidas). */
  accent: {
    50: '#e6fff7',
    100: '#b8ffe9',
    200: '#7df7d6',
    300: '#43e9c0',
    400: '#1fd3a8',
    500: '#12b391',
    600: '#0d8f75',
    700: '#0b6f5c',
    800: '#0a5748',
    900: '#074036',
  },
  /** Estrelas de avaliação preenchidas (dourado, independente do acento teal). */
  star: '#eab308',
  /** Texto e bordas sobre o fundo escuro. */
  content: {
    primary: '#f2fbf8',
    secondary: '#a7c4ba',
    muted: '#6f8f84',
    inverse: '#04110d',
  },
  border: {
    subtle: '#153529',
    default: '#1d4738',
    strong: '#2a6450',
  },
  /** Estados de feedback (moderacao, validacao de formulario). */
  status: {
    success: '#2fd28f',
    warning: '#f0b429',
    danger: '#f2555a',
    info: '#49b6ff',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
  '2xl': '4rem',
} as const;

export const radii = {
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    display: '3.5rem',
    h1: '2.5rem',
    h2: '1.875rem',
    h3: '1.375rem',
    body: '1rem',
    small: '0.875rem',
    caption: '0.75rem',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

/** Glow teal usado nos cards e botoes de destaque. */
export const shadows = {
  glowSm: '0 0 0 1px rgba(31, 211, 168, 0.18), 0 8px 24px -12px rgba(31, 211, 168, 0.35)',
  glowMd: '0 0 0 1px rgba(31, 211, 168, 0.28), 0 18px 48px -18px rgba(31, 211, 168, 0.55)',
  // Sombra + filete de luz no topo: separa o card do fundo escuro sem clareá-lo demais.
  card: '0 16px 40px -24px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.045)',
} as const;

export const tokens = { colors, spacing, radii, typography, shadows } as const;

export type Tokens = typeof tokens;
