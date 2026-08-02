'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { experienceLabel, modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { canAccessPath } from '../role-experience';
import { useRoleExperience } from './RoleExperienceProvider';

/**
 * Blocks module routes that the active experience lens does not allow.
 */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/app';
  const { locale } = useLocale();
  const { effectivePermissions, mode, available, setMode, ready } = useRoleExperience();
  const shell = getShellCopy(locale);

  if (!ready) return <>{children}</>;

  const access = canAccessPath(pathname, effectivePermissions);
  if (access.ok) return <>{children}</>;

  return (
    <div className="kuteka-detail-panel flex flex-col gap-4 p-6">
      <p className="kuteka-detail-eyebrow">{modeBadgeLabel(mode, locale)}</p>
      <h1 className="kuteka-detail-title">{shell.routeBlocked.title}</h1>
      <p className="kuteka-detail-body">{shell.routeBlocked.body}</p>
      <div className="flex flex-wrap gap-2">
        {available.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              buttonVariants({ variant: m === mode ? 'primary' : 'secondary', size: 'sm' }),
            )}
          >
            {experienceLabel(m, locale)}
          </button>
        ))}
        <Link href="/app" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          {shell.routeBlocked.home}
        </Link>
      </div>
    </div>
  );
}
