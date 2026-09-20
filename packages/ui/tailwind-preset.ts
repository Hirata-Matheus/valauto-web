import type { Config } from 'tailwindcss';
import { colors, radii, shadows, spacing, typography } from './src/tokens';

/**
 * Preset compartilhado do Tailwind, derivado dos tokens.
 *
 * O apps/web consome via `presets: [valautoPreset]`. Quando o apps/mobile
 * existir, o NativeWind consome o mesmo preset — os tokens continuam sendo a
 * unica fonte de verdade das cores/tipografia nas duas plataformas.
 */
export const valautoPreset = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: colors.base,
        accent: colors.accent,
        content: colors.content,
        line: colors.border,
        status: colors.status,
      },
      // Copia mutavel: os tokens sao `as const` e o Tailwind espera string[].
      fontFamily: { sans: [...typography.fontFamily.sans] },
      fontSize: {
        display: [typography.fontSize.display, { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        h1: [typography.fontSize.h1, { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: [typography.fontSize.h2, { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        h3: [typography.fontSize.h3, { lineHeight: '1.3' }],
        caption: [typography.fontSize.caption, { lineHeight: '1.4' }],
      },
      spacing: {
        'token-xs': spacing.xs,
        'token-sm': spacing.sm,
        'token-md': spacing.md,
        'token-lg': spacing.lg,
        'token-xl': spacing.xl,
        'token-2xl': spacing['2xl'],
      },
      borderRadius: {
        token: radii.md,
        'token-lg': radii.lg,
        'token-xl': radii.xl,
      },
      boxShadow: {
        'glow-sm': shadows.glowSm,
        'glow-md': shadows.glowMd,
        card: shadows.card,
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
} satisfies Config;

export default valautoPreset;
