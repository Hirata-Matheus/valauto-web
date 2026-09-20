import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isSupabaseConfigured, requireSupabaseCredentials } from '@/lib/env';

/**
 * Client do Supabase para Server Components e Route Handlers.
 *
 * Em Server Components a escrita de cookie e ignorada (o Next nao permite);
 * o refresh de sessao acontece no middleware, que pode escrever.
 */
export async function createServerSupabase() {
  const { url, anonKey } = requireSupabaseCredentials();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component: o middleware ja cuidou do refresh.
        }
      },
    },
  });
}

/** Versao tolerante: devolve null quando o Supabase nao esta configurado. */
export async function createOptionalServerSupabase() {
  if (!isSupabaseConfigured) return null;
  return createServerSupabase();
}
