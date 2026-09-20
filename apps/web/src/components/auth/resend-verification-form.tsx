'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { resendVerificationSchema } from '@valauto/shared';
import { isSupabaseConfigured, siteUrl } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/use-session';

/**
 * Reenvio do e-mail de confirmação.
 *
 * O retorno é sempre o mesmo, tenha o e-mail cadastro ou não: responder de
 * forma diferente revelaria quais endereços existem na base.
 */
export function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get('erro') === 'link';
  const { user } = useSession();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Pré-preenche com o e-mail de quem já está logado mas não confirmou.
  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email);
  }, [user?.email]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'E-mail inválido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: parsed.data.email,
        options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/` },
      });

      // Rate limit do provedor é o único erro que vale mostrar.
      if (resendError && /rate limit|too many/i.test(resendError.message)) {
        throw new Error('Muitos envios em sequência. Aguarde alguns minutos.');
      }

      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="surface p-6">
        <h1 className="mb-2 text-h2 font-bold">Verificação indisponível</h1>
        <p className="text-sm text-content-secondary">
          Configure as variáveis do Supabase em <code className="text-accent-300">.env.local</code>.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="surface flex flex-col items-center gap-3 p-6 text-center">
        <MailCheck className="h-10 w-10 text-accent-400" aria-hidden="true" />
        <h1 className="text-h2 font-bold">Link enviado</h1>
        <p className="text-sm text-content-secondary">
          Se houver uma conta pendente de confirmação para{' '}
          <strong className="text-content-primary">{email}</strong>, o link de verificação chegará em
          instantes.
        </p>
        <Link href="/catalogo" className="btn-secondary mt-2">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-h2 font-bold">Reenviar confirmação</h1>
        <p className="text-sm text-content-secondary">
          Enquanto o e-mail não for confirmado, a conta navega normalmente mas não publica opiniões.
        </p>
      </div>

      {linkError && (
        <p className="rounded-token border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-status-warning">
          O link usado expirou ou já tinha sido usado. Peça um novo abaixo.
        </p>
      )}

      <label className="block">
        <span className="label">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </label>

      {error && (
        <p
          className="rounded-token border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? 'Enviando…' : 'Reenviar link de confirmação'}
      </button>
    </form>
  );
}
