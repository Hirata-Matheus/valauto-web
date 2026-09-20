'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, MailCheck } from 'lucide-react';
import type { RatingCategory, Review } from '@valauto/shared';
import { isSupabaseConfigured } from '@/lib/env';
import { useSession } from '@/lib/use-session';
import { ReviewForm } from './review-form';

/**
 * Bloco de publicar opiniao — ilha client.
 *
 * Decide o que mostrar conforme o estado da conta. Regra do produto: navegar e
 * livre; publicar exige conta COM e-mail confirmado. Cada estado tem um CTA
 * claro, em vez de um botao desabilitado sem explicacao.
 */
export function ReviewSection({
  vehicleId,
  vehicleSlug,
  categories,
}: {
  vehicleId: string;
  vehicleSlug: string;
  categories: RatingCategory[];
}) {
  const { user, isLoading } = useSession();
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const isVerified = user?.emailVerifiedAt != null;

  // Busca a opiniao que o proprio usuario ja publicou (1 por usuario/veiculo),
  // para que o formulario abra em modo de edicao.
  useEffect(() => {
    if (!isVerified) {
      setExistingReview(null);
      return;
    }

    let active = true;
    fetch(`/api/reviews/me?vehicleId=${encodeURIComponent(vehicleId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Review | null) => {
        if (active) setExistingReview(data);
      })
      .catch(() => {
        // Sem review previa o formulario abre vazio — nada a tratar.
      });

    return () => {
      active = false;
    };
  }, [isVerified, vehicleId]);

  if (!isSupabaseConfigured) {
    return (
      <Callout title="Autenticação não configurada">
        Defina <code className="text-accent-300">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
        <code className="text-accent-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em{' '}
        <code className="text-accent-300">.env.local</code> para habilitar cadastro, verificação de
        e-mail e publicação de opiniões. O catálogo usa dados de exemplo enquanto isso.
      </Callout>
    );
  }

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-token-lg bg-base-900/70" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Callout title="Entre para avaliar este veículo">
        <p className="mb-4">
          Navegar e comparar é livre. Publicar uma opinião exige conta com e-mail confirmado.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cadastro?next=${encodeURIComponent(`/veiculos/${vehicleSlug}`)}`}
            className="btn-primary"
          >
            Criar conta
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(`/veiculos/${vehicleSlug}`)}`}
            className="btn-secondary"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Já tenho conta
          </Link>
        </div>
      </Callout>
    );
  }

  if (!isVerified) {
    return (
      <Callout title="Confirme seu e-mail para publicar" tone="warning">
        <p className="mb-4">
          Enviamos um link de confirmação para <strong>{user.email}</strong>. Depois de clicar nele,
          o botão de avaliar é liberado automaticamente.
        </p>
        <Link href="/verificar-email" className="btn-primary">
          <MailCheck className="h-4 w-4" aria-hidden="true" />
          Reenviar e-mail de confirmação
        </Link>
      </Callout>
    );
  }

  return (
    <ReviewForm vehicleId={vehicleId} categories={categories} existingReview={existingReview} />
  );
}

function Callout({
  title,
  children,
  tone = 'default',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'default' | 'warning';
}) {
  return (
    <div
      className={
        tone === 'warning'
          ? 'rounded-token-lg border border-status-warning/40 bg-status-warning/5 p-5'
          : 'surface p-5'
      }
    >
      <h3 className="mb-2 text-h3 font-semibold">{title}</h3>
      <div className="text-sm text-content-secondary">{children}</div>
    </div>
  );
}
