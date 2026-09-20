'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card com spotlight que segue o cursor (padrao Aceternity UI).
 *
 * A posicao do mouse vai para CSS custom properties e o brilho e desenhado por
 * um radial-gradient — sem re-render do React a cada mousemove.
 */
export function GlowCard({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    element.style.setProperty('--spot-opacity', '1');
  }

  function handleMouseLeave() {
    ref.current?.style.setProperty('--spot-opacity', '0');
  }

  return (
    <Tag
      ref={ref as never}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group/glow relative overflow-hidden rounded-token-lg border border-line-default bg-base-850',
        'shadow-card transition-[border-color,transform] duration-300',
        'hover:-translate-y-1 hover:border-accent-600',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--spot-opacity,0)] transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(18rem circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(31, 211, 168, 0.12), transparent 65%)',
        }}
      />
      {children}
    </Tag>
  );
}
