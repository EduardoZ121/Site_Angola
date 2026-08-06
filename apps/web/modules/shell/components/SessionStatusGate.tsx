'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '@/modules/authentication/content';
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
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);

  if (status === 'error') {
    return (
      <EmptyState
        title={copy.common.sessionExpired}
        description={error ?? copy.app.loadError}
        action={
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            {copy.login.submit}
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
