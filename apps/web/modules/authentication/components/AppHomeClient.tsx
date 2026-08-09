'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PlatformFeed } from '@/modules/shell/components/PlatformFeed';
import { RoleHomeDashboard } from '@/modules/shell/components/RoleHomeDashboard';
import { RoleMissionPanel } from '@/modules/shell/components/RoleMissionPanel';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import { modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import {
  operatingProfileFor,
  ROLE_HOME_CTA_LABELS_PT,
} from '@/modules/shell/role-operating-matrix';
import { getAuthCopy } from '../content';
import { useAppSession } from './app-session';

/**
 * /app home — experience cockpit driven by the official role operating matrix.
 * CTAs follow mission of the active experience, not raw permission soup.
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
  const profile = operatingProfileFor(mode);
  const canHousing = effectivePermissions.includes('housing.explore');
  const showFeed =
    mode === 'client' ||
    mode === 'client_partner' ||
    mode === 'certified_agent' ||
    (mode === 'patrimonial_partner' && canHousing);

  return (
    <div className="flex flex-col gap-4">
      <header className="kuteka-detail-panel flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="kuteka-detail-eyebrow">{modeBadgeLabel(mode, locale)}</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {greetingName ? `${copy.app.welcome}, ${greetingName}` : copy.app.welcomeAnonymous}
          </h1>
          <p className="kuteka-detail-body mt-0.5">{profile.mission}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.homeCtas.map((cta) => (
            <Link
              key={`${cta.href}-${cta.labelKey}`}
              href={cta.href}
              className={cn(
                buttonVariants({
                  variant: cta.primary ? 'primary' : 'secondary',
                  size: 'sm',
                }),
                'w-fit',
              )}
            >
              {ROLE_HOME_CTA_LABELS_PT[cta.labelKey]}
            </Link>
          ))}
        </div>
      </header>

      <RoleMissionPanel mode={mode} />

      <RoleHomeDashboard session={session} />

      {showFeed ? <PlatformFeed canExplore={canHousing} /> : null}
    </div>
  );
}
