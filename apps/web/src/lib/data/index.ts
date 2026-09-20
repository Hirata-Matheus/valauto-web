import { isSupabaseConfigured } from '@/lib/env';
import { createOptionalServerSupabase } from '@/lib/supabase/server';
import { createMemoryRepository } from './memory-repository';
import { createSupabaseRepository } from './supabase-repository';
import type { VehicleRepository } from './repository';

/**
 * Resolve a camada de dados da requisicao.
 *
 * Com Supabase configurado usa o Postgres (respeitando RLS com a sessao do
 * usuario); sem configuracao cai para o dataset em memoria, para que o
 * catalogo continue navegavel em desenvolvimento.
 */
export async function getRepository(): Promise<VehicleRepository> {
  if (!isSupabaseConfigured) return createMemoryRepository();
  const supabase = await createOptionalServerSupabase();
  if (!supabase) return createMemoryRepository();
  return createSupabaseRepository(supabase);
}

export { RepositoryError } from './repository';
export type { VehicleRepository } from './repository';
