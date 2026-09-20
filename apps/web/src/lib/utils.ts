import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge de classes Tailwind (padrao usado pelos componentes Aceternity UI). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
