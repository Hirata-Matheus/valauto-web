import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseCredentials } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Client do Supabase SEM sessao e SEM cookies, para leituras publicas.
 *
 * E o que torna possivel o ISR: ler `cookies()` em uma pagina a torna
 * dinamica (e quebra generateStaticParams). Catalogo, detalhe, notas e
 * opinioes publicadas sao publicos pela RLS, entao nao precisam de sessao.
 * Tudo que depende do usuario (publicar, editar, denunciar) usa
 * createServerSupabase(), so em rotas de API.
 */
export function createPublicSupabase(): SupabaseClient {
  if (cached) return cached;

  const { url, anonKey } = requireSupabaseCredentials();
  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}
