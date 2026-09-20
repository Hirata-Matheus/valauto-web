import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta ValAuto.',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="surface h-80 animate-pulse" aria-hidden="true" />}>
      <LoginForm />
    </Suspense>
  );
}
