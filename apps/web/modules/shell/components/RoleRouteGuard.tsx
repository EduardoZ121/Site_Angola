'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getShellCopy } from '../content/pt';
import { canAccessPath, EXPERIENCE_LABELS } from '../role-experience';
import { useRoleExperience } from './RoleExperienceProvider';

/**
 * Blocks module routes that the active experience lens does not allow.
 */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/app';
  const { effectivePermissions, mode, available, setMode, ready } = useRoleExperience();
  const shell = getShellCopy();

  if (!ready) return <>{children}</>;

  const access = canAccessPath(pathname, effectivePermissions);
  if (access.ok) return <>{children}</>;

  return (
    <div className="kuteka-detail-panel flex flex-col gap-4 p-6">
      <p className="kuteka-detail-eyebrow">{EXPERIENCE_LABELS[mode]}</p>
      <h1 className="kuteka-detail-title">{shell.routeBlocked.title}</h1>
      <p className="kuteka-detail-body">{shell.routeBlocked.body}</p>
      <p className="kuteka-detail-meta">
        Permissão necessária nesta experiência: <code>{access.permission}</code>
      </p>
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
            {EXPERIENCE_LABELS[m]}
          </button>
        ))}
        <Link href="/app" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          {shell.routeBlocked.home}
        </Link>
      </div>
    </div>
  );
}
