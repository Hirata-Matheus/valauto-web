import Link from 'next/link';
import { NavLink } from './nav-link';
import { HeaderAuth } from './header-auth';

/**
 * Header estatico com a autenticacao isolada em ilha client — ver
 * lib/use-session.ts para o porque (preserva o ISR das paginas de conteudo).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-base-950/80 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-token"
          aria-label="ValAuto, página inicial"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-token bg-accent-400 text-base font-bold text-content-inverse"
            aria-hidden="true"
          >
            V
          </span>
          <span className="text-lg font-bold tracking-tight">
            Val<span className="text-accent-300">Auto</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          <NavLink href="/">Início</NavLink>
          <NavLink href="/catalogo">Catálogo</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
