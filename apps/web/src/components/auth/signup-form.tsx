'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { signUpSchema } from '@valauto/shared';
import { isSupabaseConfigured, siteUrl } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';

/**
 * Cadastro com verificação de e-mail.
 *
 * O Supabase cria o usuário já com email_confirmed_at nulo e dispara o e-mail
 * de confirmação; até o clique no link, a conta navega mas não publica.
 */
export function SignUpForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os dados informados.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { name: parsed.data.name },
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (signUpError) throw new Error(traduzirErro(signUpError.message));
      setSentTo(parsed.data.email);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="surface p-6">
        <h1 className="mb-2 text-h2 font-bold">Cadastro indisponível</h1>
        <p className="text-sm text-content-secondary">
          Configure <code className="text-accent-300">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
          <code className="text-accent-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para habilitar
          contas. O catálogo continua navegável com dados de exemplo.
        </p>
      </div>
    );
  }

  if (sentTo) {
    return (
      <div className="surface flex flex-col items-center gap-3 p-6 text-center">
        <MailCheck className="h-10 w-10 text-accent-400" aria-hidden="true" />
        <h1 className="text-h2 font-bold">Confirme seu e-mail</h1>
        <p className="text-sm text-content-secondary">
          Enviamos um link de confirmação para <strong className="text-content-primary">{sentTo}</strong>.
          Clique nele para liberar a publicação de opiniões.
        </p>
        <Link href="/catalogo" className="btn-secondary mt-2">
          Explorar o catálogo enquanto isso
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-h2 font-bold">Criar conta</h1>
        <p className="text-sm text-content-secondary">
          Navegar e comparar é livre. A conta serve para publicar suas opiniões.
        </p>
      </div>

      <label className="block">
        <span className="label">Nome</span>
        <input
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="field"
        />
      </label>

      <label className="block">
        <span className="label">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="field"
        />
      </label>

      <label className="block">
        <span className="label">Senha</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="field"
          aria-describedby="senha-dica"
        />
        <span id="senha-dica" className="mt-1 block text-caption text-content-muted">
          Mínimo de 8 caracteres, com ao menos uma letra e um número.
        </span>
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
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </button>

      <p className="text-center text-sm text-content-secondary">
        Já tem conta?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-accent-300 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

/** Mensagens do Supabase chegam em inglês; traduz as mais comuns. */
function traduzirErro(message: string): string {
  if (/already registered/i.test(message)) return 'Este e-mail já tem cadastro. Tente entrar.';
  if (/rate limit|too many/i.test(message)) {
    return 'Muitas tentativas em sequência. Aguarde alguns minutos.';
  }
  if (/password/i.test(message)) return 'Senha recusada. Use ao menos 8 caracteres com letra e número.';
  return message;
}
