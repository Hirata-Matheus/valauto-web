import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-token-2xl text-center">
      <p className="text-display font-bold text-accent-400/30">404</p>
      <h1 className="text-h1 font-bold">Página não encontrada</h1>
      <p className="max-w-md text-content-secondary">
        O veículo ou a página que você procura não existe mais — ou nunca existiu.
      </p>
      <Link href="/catalogo" className="btn-primary">
        Ir para o catálogo
      </Link>
    </div>
  );
}
