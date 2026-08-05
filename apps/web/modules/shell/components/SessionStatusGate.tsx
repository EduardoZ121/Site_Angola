'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { EmptyState } from './EmptyState';

type SessionStatus = 'loading' | 'ready' | 'error';

type SessionStatusGateProps = {
  status: SessionStatus;
  error?: string | null;
  /** @deprecated Ignored — page-level skeletons caused flicker. */
  rows?: number;
  children: React.ReactNode;
};

/**
 * Session error wall only.
 * Never swaps the tree for skeletons (root cause of flash on TOKEN_REFRESHED).
 * While status === 'loading', children stay mounted and decide soft placeholders.
 */
export function SessionStatusGate({ status, error, children }: SessionStatusGateProps) {
  if (status === 'error') {
    return (
      <EmptyState
        title="Sessão indisponível"
        description={
          error ?? 'A sua sessão expirou ou não foi validada. Entre novamente para continuar.'
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
