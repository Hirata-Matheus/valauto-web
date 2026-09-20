'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInSchema } from '@valauto/shared';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const configError = searchParams.get('erro') === 'configuracao';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os dados informados.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
      if (signInError) throw new Error(traduzirErro(signInError.message));

      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="surface p-6">
        <h1 className="mb-2 text-h2 font-bold">Login indisponível</h1>
        <p className="text-sm text-content-secondary">
          Configure as variáveis do Supabase em <code className="text-accent-300">.env.local</code>{' '}
          para habilitar contas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-h2 font-bold">Entrar</h1>
        <p className="text-sm text-content-secondary">
          Use a conta com e-mail confirmado para publicar opiniões.
        </p>
      </div>

      {configError && (
        <p className="rounded-token border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-status-warning">
          Autenticação não configurada no servidor.
        </p>
      )}

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
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
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
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>

      <div className="flex flex-col gap-1 text-center text-sm text-content-secondary">
        <span>
          Não tem conta?{' '}
          <Link
            href={`/cadastro?next=${encodeURIComponent(next)}`}
            className="text-accent-300 hover:underline"
          >
            Criar conta
          </Link>
        </span>
        <Link href="/verificar-email" className="text-content-muted hover:text-content-secondary">
          Não recebi o e-mail de confirmação
        </Link>
      </div>
    </form>
  );
}

function traduzirErro(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Muitas tentativas em sequência. Aguarde alguns minutos.';
  }
  return message;
}
