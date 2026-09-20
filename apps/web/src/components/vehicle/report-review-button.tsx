'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useSession } from '@/lib/use-session';

/**
 * Denuncia de opiniao impropria.
 *
 * A denuncia entra na fila de moderacao do admin (Fase 3); aqui o retorno para
 * quem denunciou e imediato e nao revela se a review foi ou nao removida.
 * So aparece para quem esta logado — denunciar exige conta.
 */
export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const { user } = useSession();
  const [state, setState] = useState<'idle' | 'prompting' | 'sending' | 'done' | 'error'>('idle');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!user) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('sending');
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Não foi possível enviar a denúncia.');
      }
      setState('done');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <span className="text-caption text-content-muted" role="status">
        Denúncia enviada
      </span>
    );
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setState('prompting')}
        className="btn-ghost px-2 py-1"
        aria-label="Denunciar esta avaliação"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:w-72">
      <label className="label" htmlFor={`reason-${reviewId}`}>
        Motivo da denúncia
      </label>
      <textarea
        id={`reason-${reviewId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
        minLength={5}
        maxLength={500}
        rows={2}
        className="field"
        placeholder="Descreva o problema com esta avaliação"
      />
      {message && <p className="text-caption text-status-danger">{message}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="btn-primary px-3 py-1.5">
          {state === 'sending' ? 'Enviando…' : 'Enviar'}
        </button>
        <button type="button" onClick={() => setState('idle')} className="btn-ghost px-3 py-1.5">
          Cancelar
        </button>
      </div>
    </form>
  );
}
