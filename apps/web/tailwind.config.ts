import type { Config } from 'tailwindcss';
import { valautoPreset } from '@valauto/ui/tailwind-preset';

export default {
  presets: [valautoPreset],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
} satisfies Config;
