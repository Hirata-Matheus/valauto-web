import { isSupabaseConfigured } from '@/lib/env';
import { createPublicSupabase } from '@/lib/supabase/public';
import { createServerSupabase } from '@/lib/supabase/server';
import { createMemoryRepository } from './memory-repository';
import { createSupabaseRepository } from './supabase-repository';
import type { VehicleRepository } from './repository';

let warnedAboutFallback = false;

function fallbackToMemory(): VehicleRepository {
  // Fallback silencioso e perigoso: parece que o app esta no banco quando nao
  // esta. Avisa uma vez por processo para o problema nao passar despercebido.
  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      '[valauto] Supabase não configurado — usando dados de exemplo em memória. ' +
        'Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return createMemoryRepository();
}

/**
 * Repositorio para LEITURAS PUBLICAS (catalogo, detalhe, notas, opinioes).
 *
 * Nao le cookies, entao e seguro em paginas estaticas/ISR, em
 * generateStaticParams e no sitemap. A visibilidade continua garantida pela
 * RLS: sem sessao, so as opinioes publicadas aparecem.
 */
export function getPublicRepository(): VehicleRepository {
  if (!isSupabaseConfigured) return fallbackToMemory();
  return createSupabaseRepository(createPublicSupabase());
}

/**
 * Repositorio COM a sessao do usuario, para o que depende de quem esta logado:
 * publicar/editar opiniao, denunciar, "minha opiniao". Le cookies, portanto so
 * pode ser chamado em rotas dinamicas (Route Handlers), nunca em paginas ISR.
 */
export async function getSessionRepository(): Promise<VehicleRepository> {
  if (!isSupabaseConfigured) return fallbackToMemory();
  return createSupabaseRepository(await createServerSupabase());
}

export { RepositoryError } from './repository';
export type { VehicleRepository } from './repository';
