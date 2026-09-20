'use client';

import { useEffect, useState } from 'react';
import type { User } from '@valauto/shared';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';

export interface SessionState {
  user: User | null;
  isLoading: boolean;
}

/**
 * Sessao no client.
 *
 * A autenticacao vive em ilhas client (header, bloco de avaliar) de proposito:
 * ler cookie em Server Component forcaria render dinamico em toda rota que usa
 * o layout, e o catalogo/detalhe perderiam o ISR que sustenta o SEO. O conteudo
 * indexavel continua vindo pronto do servidor; so o estado de login hidrata.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, isLoading: isSupabaseConfigured });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    let active = true;

    function toUser(authUser: {
      id: string;
      email?: string;
      email_confirmed_at?: string | null;
      created_at: string;
      user_metadata?: Record<string, unknown>;
    }): User {
      const metadataName =
        typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name : null;
      return {
        id: authUser.id,
        name: metadataName ?? authUser.email?.split('@')[0] ?? 'Usuário ValAuto',
        email: authUser.email ?? '',
        emailVerifiedAt: authUser.email_confirmed_at ?? null,
        avatarUrl:
          typeof authUser.user_metadata?.avatar_url === 'string'
            ? authUser.user_metadata.avatar_url
            : null,
        role: 'user',
        createdAt: authUser.created_at,
      };
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setState({ user: data.user ? toUser(data.user) : null, isLoading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({ user: session?.user ? toUser(session.user) : null, isLoading: false });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
