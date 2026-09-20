'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

/**
 * Grid do catalogo com entrada em stagger (GSAP).
 *
 * Os cards sao renderizados no servidor e chegam visiveis; o efeito so os
 * desloca no primeiro frame apos a montagem. A chave `animationKey` refaz a
 * animacao quando os filtros mudam o conjunto exibido.
 */
export function VehicleGrid({
  children,
  animationKey,
  className,
}: {
  children: React.ReactNode;
  animationKey?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = element.children;
    if (cards.length === 0) return;

    const context = gsap.context(() => {
      gsap.from(cards, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'opacity,transform',
      });
    }, element);

    return () => context.revert();
  }, [animationKey]);

  return (
    <div
      ref={ref}
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}
    >
      {children}
    </div>
  );
}
