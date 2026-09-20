'use client';

import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseCredentials } from '@/lib/env';

/** Client do Supabase para componentes client (sessao em cookie). */
export function createClient() {
  const { url, anonKey } = requireSupabaseCredentials();
  return createBrowserClient(url, anonKey);
}
