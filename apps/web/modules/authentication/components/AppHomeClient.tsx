'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PlatformFeed } from '@/modules/shell/components/PlatformFeed';
import { RoleHomeDashboard } from '@/modules/shell/components/RoleHomeDashboard';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import { modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import { useAppSession } from './app-session';

/**
 * /app home — experience cockpit + continuous Feed.
 */
export function AppHomeClient() {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);
  const { session, status, error } = useAppSession();
  const { mode, effectivePermissions } = useRoleExperience();

  if (status === 'error' || (status === 'ready' && !session)) {
    return (
      <div className="flex flex-col gap-4">
        <header className="kuteka-detail-panel flex flex-col gap-2 p-5">
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
        <header className="kuteka-detail-panel px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Feed</p>
          <Text className="text-sm text-stone-600">{copy.app.feedPreparing}</Text>
        </header>
        <SoftListSlot pending minHeightClassName="min-h-[70vh]" />
      </div>
    );
  }

  if (!session) return null;

  const greetingName = session.displayName;
  const canManage = effectivePermissions.includes('properties.manage');
  const canHousing = effectivePermissions.includes('housing.explore');
  const canContracts = effectivePermissions.includes('contracts.manage');
  const canAgent = effectivePermissions.includes('agent.operate');
  const canAdmin = effectivePermissions.includes('admin.panel');
  const showFeed = canHousing || mode === 'client_partner' || mode === 'certified_agent';

  return (
    <div className="flex flex-col gap-4">
      <header className="kuteka-detail-panel flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="kuteka-detail-eyebrow">{modeBadgeLabel(mode, locale)}</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {greetingName ? `${copy.app.welcome}, ${greetingName}` : copy.app.welcomeAnonymous}
          </h1>
          <p className="kuteka-detail-body mt-0.5">{copy.app.experienceHint}</p>
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
              className={cn(
                buttonVariants({ variant: canManage ? 'secondary' : 'primary', size: 'sm' }),
                'w-fit',
              )}
            >
              {copy.app.quickExploreHousing}
            </Link>
          ) : null}
          {canAgent ? (
            <Link
              href="/app/agente"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickAgent}
            </Link>
          ) : null}
          {canAdmin ? (
            <Link
              href="/app/admin"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickAdmin}
            </Link>
          ) : null}
          {canContracts ? (
            <Link
              href="/app/contratos"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickContracts}
            </Link>
          ) : null}
          {!canManage && !canHousing && !canAgent && !canAdmin ? (
            <Link
              href="/auth/onboarding/papeis"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
            >
              {copy.app.quickRoles}
            </Link>
          ) : null}
        </div>
      </header>

      <RoleHomeDashboard session={session} />

      {showFeed ? <PlatformFeed canExplore={canHousing} /> : null}
    </div>
  );
}
