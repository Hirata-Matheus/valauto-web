'use client';

import Link from 'next/link';
import { useSession } from '@/lib/use-session';
import { UserMenu } from './user-menu';

/**
 * Ilha de autenticacao do header.
 *
 * Enquanto a sessao carrega mostra um esqueleto do mesmo tamanho, evitando
 * deslocamento de layout quando o estado real chega.
 */
export function HeaderAuth() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <div className="h-9 w-32 animate-pulse rounded-token bg-base-800" aria-hidden="true" />;
  }

  if (user) return <UserMenu user={user} />;

  return (
    <>
      <Link href="/login" className="btn-ghost">
        Entrar
      </Link>
      <Link href="/cadastro" className="btn-primary">
        Criar conta
      </Link>
    </>
  );
}
