'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, MailWarning, User as UserIcon } from 'lucide-react';
import type { User } from '@valauto/shared';
import { createClient } from '@/lib/supabase/client';

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const needsVerification = user.emailVerifiedAt === null;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await createClient().auth.signOut();
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {needsVerification && (
        <span
          className="badge border-status-warning/40 text-status-warning"
          title="Confirme seu e-mail para publicar avaliações"
        >
          <MailWarning className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">E-mail não confirmado</span>
        </span>
      )}

      <span className="hidden items-center gap-2 text-sm text-content-secondary sm:flex">
        <UserIcon className="h-4 w-4" aria-hidden="true" />
        {user.name.split(' ')[0]}
      </span>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="btn-ghost"
        aria-label="Sair da conta"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{isSigningOut ? 'Saindo…' : 'Sair'}</span>
      </button>
    </div>
  );
}
