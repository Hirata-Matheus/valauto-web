import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { RepositoryError } from '@/lib/data';

/** Resposta de erro padronizada — o client le sempre a chave `error`. */
export function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Converte excecoes conhecidas em resposta HTTP.
 *
 * Erros inesperados viram 500 genérico: a mensagem interna fica no log do
 * servidor, nao na resposta.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse(
      error.issues[0]?.message ?? 'Dados inválidos',
      400,
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  if (error instanceof RepositoryError) {
    return errorResponse(error.message, error.status);
  }

  console.error('[api] erro não tratado:', error);
  return errorResponse('Erro interno. Tente novamente.', 500);
}

/** Remove caracteres de controle e normaliza espacos em texto livre. */
export function sanitizeText(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}
