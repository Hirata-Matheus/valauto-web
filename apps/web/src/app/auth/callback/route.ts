import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Destino do link de confirmação de e-mail (e do login social).
 *
 * Aceita os dois formatos que o Supabase pode enviar:
 *  - `code`: fluxo PKCE padrão → exchangeCodeForSession;
 *  - `token_hash` + `type`: template de e-mail customizado → verifyOtp.
 *
 * Em ambos os casos a sessão sai gravada em cookie httpOnly e o
 * email_confirmed_at passa a valer, liberando a publicação de opiniões.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  // Só aceita caminho interno — evita open redirect via ?next=https://...
  const rawNext = searchParams.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?erro=configuracao`);
  }

  const supabase = await createServerSupabase();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?confirmado=1`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?confirmado=1`);
    }
  }

  return NextResponse.redirect(`${origin}/verificar-email?erro=link`);
}
