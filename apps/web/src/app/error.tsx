'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[valauto] erro na página:', error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-4 py-token-2xl text-center">
      <h1 className="text-h1 font-bold">Algo deu errado</h1>
      <p className="max-w-md text-content-secondary">
        Não foi possível carregar esta página. Tente novamente em instantes.
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Tentar novamente
      </button>
    </div>
  );
}
