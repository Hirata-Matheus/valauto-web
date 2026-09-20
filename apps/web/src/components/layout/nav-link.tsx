'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative rounded-token px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'text-accent-300'
          : 'text-content-secondary hover:text-content-primary',
      )}
    >
      {children}
      {isActive && (
        <span className="absolute inset-x-3 -bottom-px h-px bg-accent-400" aria-hidden="true" />
      )}
    </Link>
  );
}
