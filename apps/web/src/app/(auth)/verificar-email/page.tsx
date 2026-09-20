import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResendVerificationForm } from '@/components/auth/resend-verification-form';

export const metadata: Metadata = {
  title: 'Confirmar e-mail',
  description: 'Reenvie o link de confirmação da sua conta ValAuto.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="surface h-80 animate-pulse" aria-hidden="true" />}>
      <ResendVerificationForm />
    </Suspense>
  );
}
