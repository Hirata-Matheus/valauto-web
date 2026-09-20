import type { User } from '@valauto/shared';
import { isSupabaseConfigured } from '@/lib/env';
import { createOptionalServerSupabase } from '@/lib/supabase/server';

/**
 * Sessao do lado do servidor.
 *
 * `emailVerifiedAt` e o que libera a publicacao de opiniao — ele vem do
 * auth.users.email_confirmed_at, nao de um campo que o usuario controla.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createOptionalServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, role, email_verified_at')
    .eq('id', user.id)
    .maybeSingle();

  const metadataName =
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;

  return {
    id: user.id,
    name: (profile?.name as string | undefined)?.trim() || metadataName || 'Usuário ValAuto',
    email: user.email ?? '',
    emailVerifiedAt:
      (profile?.email_verified_at as string | null | undefined) ?? user.email_confirmed_at ?? null,
    avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
    role: (profile?.role as 'user' | 'admin' | undefined) ?? 'user',
    createdAt: user.created_at,
  };
}

export function isEmailVerified(user: User | null): boolean {
  return user?.emailVerifiedAt !== null && user?.emailVerifiedAt !== undefined;
}
