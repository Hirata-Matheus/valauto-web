import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-token-2xl border-t border-line-subtle bg-base-950/60">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-content-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} ValAuto — avaliações feitas por quem dirige.
        </p>
        <nav className="flex gap-4" aria-label="Links do rodapé">
          <Link href="/catalogo" className="hover:text-content-secondary">
            Catálogo
          </Link>
          <Link href="/cadastro" className="hover:text-content-secondary">
            Criar conta
          </Link>
        </nav>
      </div>
    </footer>
  );
}
