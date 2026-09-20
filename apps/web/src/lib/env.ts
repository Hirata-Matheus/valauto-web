/**
 * Leitura centralizada das variaveis de ambiente.
 *
 * O app roda sem Supabase configurado: nesse caso a camada de dados cai para o
 * repositorio em memoria (dados de seed), o que mantem catalogo e detalhe
 * navegaveis em desenvolvimento. Autenticacao, essa sim, exige Supabase.
 */

// Chave publica do projeto. O Supabase agora emite "publishable keys"
// (sb_publishable_...); a "anon key" JWT legada segue aceita como fallback.
// Precisam ser lidas com acesso estatico a process.env.NEXT_PUBLIC_* — o Next
// so injeta essas variaveis no bundle do browser dessa forma.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publicKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const supabaseUrl = url && url.length > 0 ? url : null;
/** Chave publica (publishable ou anon). O nome `anon` e mantido por compatibilidade interna. */
export const supabaseAnonKey = publicKey && publicKey.length > 0 ? publicKey : null;

/** true quando ha credenciais suficientes para falar com o Supabase. */
export const isSupabaseConfigured = supabaseUrl !== null && supabaseAnonKey !== null;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'http://localhost:3000'
).replace(/\/$/, '');

/** Usa as credenciais ja validadas; lanca se chamada sem configuracao. */
export function requireSupabaseCredentials(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.',
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}
