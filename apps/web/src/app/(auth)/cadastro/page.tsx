import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie sua conta no ValAuto para publicar avaliações de veículos.',
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="surface h-96 animate-pulse" aria-hidden="true" />}>
      <SignUpForm />
    </Suspense>
  );
}
