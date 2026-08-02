'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { BrandMark } from '@/modules/authentication/components/BrandMark';
import type { AppSessionData } from '@/modules/authentication/components/app-session';
import { getAuthCopy } from '@/modules/authentication/content';
import { experienceLabel, modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { groupNavItems, isNavItemActive, visibleNavItems } from '../nav';
import { NavIcon } from '../nav-icons';
import { AtmosphereBackground } from './AtmosphereBackground';
import { RoleRouteGuard } from './RoleRouteGuard';
import { TopbarActions } from './TopbarActions';
import { UserMenu } from './UserMenu';
import { useRoleExperience } from './RoleExperienceProvider';

type PlatformShellProps = {
  children: ReactNode;
  session: AppSessionData | null;
  sessionStatus: 'loading' | 'ready' | 'error';
};

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const { mode, effectivePermissions } = useRoleExperience();
  const items = visibleNavItems(effectivePermissions, mode);
  const groups = groupNavItems(items);
  const showGroupHeaders = mode === 'client_partner' || groups.length > 2;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="rounded-kuteka border border-[#f0a91f]/40 bg-[#f0a91f]/10 px-3 py-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#fde68a]">
          {shell.activeExperience}
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">{modeBadgeLabel(mode, locale)}</p>
      </div>

      {groups.map(({ group, items: groupItems }) => (
        <div key={group}>
          {showGroupHeaders && group !== 'geral' ? (
            <p className="mb-1 px-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-400">
              {shell.groups[group]}
            </p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {groupItems.map((item) => {
              const label = shell.items[item.labelKey];
              const active = isNavItemActive(item, pathname);

              if (item.status === 'soon') {
                return (
                  <li key={item.id}>
                    <div
                      className="flex items-center justify-between gap-2 rounded-kuteka px-3 py-2.5 text-sm text-slate-400"
                      aria-disabled="true"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <NavIcon labelKey={item.labelKey} className="size-4 shrink-0 opacity-70" />
                        {label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{shell.soon}</span>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    href={item.href!}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-kuteka px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                      active
                        ? 'bg-[#f0a91f] text-[#08263f] shadow-sm'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <NavIcon labelKey={item.labelKey} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ShellBrand() {
  return (
    <div className="relative border-b border-white/10 px-3 py-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600"
      />
      <BrandMark href="/app" variant="shell" size="xl" />
    </div>
  );
}

/**
 * LinkedIn-style app frame (ADR-013) + role experience lens.
 */
export function PlatformShell({ children, session, sessionStatus }: PlatformShellProps) {
  const { locale } = useLocale();
  const auth = getAuthCopy(locale);
  const shell = getShellCopy(locale);
  const pathname = usePathname() || '/app';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleId = useId();
  const drawerId = useId();
  const drawerTitleId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mode } = useRoleExperience();

  const roleLabels: Record<string, string> = {
    client: auth.onboarding.roles.client,
    patrimonial_partner: auth.onboarding.roles.partner,
    certified_agent: experienceLabel('certified_agent', locale),
    administrator: experienceLabel('administrator', locale),
    super_administrator: experienceLabel('super_administrator', locale),
  };

  useEffect(() => {
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname, mode]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeBtn = document.getElementById(`${drawerId}-close`);
    closeBtn?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, drawerId]);

  return (
    <div className="kuteka-app-frame relative flex h-dvh overflow-hidden">
      <AtmosphereBackground mode="app" preset="dashboard" />

      <aside
        className="kuteka-glass-chrome relative z-20 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 md:flex lg:w-72"
        aria-label={shell.navAria}
      >
        <ShellBrand />
        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          aria-label={shell.navAria}
        >
          <NavList pathname={pathname} />
        </nav>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="kuteka-glass-chrome z-30 shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'md:hidden shrink-0 px-2 text-slate-100 hover:bg-white/10',
                )}
                aria-expanded={drawerOpen}
                aria-controls={drawerId}
                onClick={() => setDrawerOpen(true)}
              >
                <span className="sr-only">{shell.openMenu}</span>
                <span aria-hidden className="text-lg leading-none">
                  ☰
                </span>
              </button>
              <div className="min-w-0 md:hidden">
                <BrandMark href="/app" variant="inline" tone="light" size="md" />
              </div>
              <div className="hidden min-w-0 md:block">
                <p
                  id={titleId}
                  className="truncate text-sm font-semibold tracking-wide text-slate-100"
                >
                  {shell.areaTitle}
                </p>
                <p className="truncate text-xs font-semibold text-[#fde68a]">
                  {modeBadgeLabel(mode, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-100 sm:gap-2">
              <TopbarActions />
              <UserMenu session={session} sessionStatus={sessionStatus} roleLabels={roleLabels} />
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="kuteka-app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <main className="kuteka-app-main mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5">
              <RoleRouteGuard>{children}</RoleRouteGuard>
            </div>
          </main>
        </div>
      </div>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label={shell.closeMenu}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            id={drawerId}
            className="kuteka-glass-chrome absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
              <div>
                <p id={drawerTitleId} className="sr-only">
                  {shell.navAria}
                </p>
                <BrandMark href="/app" variant="shell" size="lg" />
              </div>
              <button
                id={`${drawerId}-close`}
                type="button"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'px-2 text-slate-100 hover:bg-white/10',
                )}
                onClick={() => setDrawerOpen(false)}
              >
                {shell.closeMenu}
              </button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto" aria-label={shell.navAria}>
              <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
