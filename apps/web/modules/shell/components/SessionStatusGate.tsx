'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { EmptyState } from './EmptyState';
import { ModuleSkeleton } from './ModuleSkeleton';

type SessionStatus = 'loading' | 'ready' | 'error';

type SessionStatusGateProps = {
  status: SessionStatus;
  error?: string | null;
  rows?: number;
  children: React.ReactNode;
};

/**
 * Resolves session loading/error before module data loads —
 * avoids infinite ModuleSkeleton when sessionStatus === 'error'.
 */
export function SessionStatusGate({ status, error, rows = 3, children }: SessionStatusGateProps) {
  if (status === 'loading') {
    return <ModuleSkeleton rows={rows} />;
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="Sessão indisponível"
        description={
          error ??
          'Não foi possível validar a sessão. Entre novamente para continuar na plataforma.'
        }
        action={
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            Entrar
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
