'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PlatformFeed } from '@/modules/shell/components/PlatformFeed';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAuthCopy } from '../content';
import { useAppSession } from './app-session';

/**
 * /app home — the Feed IS the platform (ADR-013).
 * Compact composer strip + continuous infinite stream. No dashboard stack.
 */
export function AppHomeClient() {
  const copy = getAuthCopy();
  const { session, status, error } = useAppSession();

  if (status === 'error' || (status === 'ready' && !session)) {
    return (
      <div className="flex flex-col gap-4">
        <header className="kuteka-glass flex flex-col gap-2 p-5">
          <Heading level={1}>{copy.app.title}</Heading>
          <div
            role="alert"
            className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            {error ?? copy.app.loadError}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/auth/entrar?next=%2Fapp"
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              {copy.login.submit}
            </Link>
            <Link
              href="/auth/onboarding/papeis"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              {copy.app.ctaRoles}
            </Link>
          </div>
        </header>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4">
        <header className="kuteka-glass px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Feed</p>
          <Text className="text-sm text-slate-500">A preparar o ambiente contínuo…</Text>
        </header>
        <SoftListSlot pending minHeightClassName="min-h-[70vh]" />
      </div>
    );
  }

  if (!session) return null;

  const greetingName = session.displayName;
  const canManage = session.permissions.includes('properties.manage');
  const canHousing = session.permissions.includes('housing.explore');
  const canContracts = session.permissions.includes('contracts.manage');

  return (
    <div className="flex flex-col gap-4">
      <header className="kuteka-glass flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Feed
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {greetingName ? `${copy.app.welcome}, ${greetingName}` : copy.app.welcomeAnonymous}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Scroll contínuo — a plataforma em movimento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Link
              href="/app/patrimonios/novo"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickActivateProperty}
            </Link>
          ) : null}
          {canHousing ? (
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickExploreHousing}
            </Link>
          ) : (
            <Link
              href="/auth/onboarding/papeis"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickRoles}
            </Link>
          )}
          {canContracts ? (
            <Link
              href="/app/contratos"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              Contratos
            </Link>
          ) : null}
        </div>
      </header>

      <PlatformFeed canExplore={canHousing} />
    </div>
  );
}
