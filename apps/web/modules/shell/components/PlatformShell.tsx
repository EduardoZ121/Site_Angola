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
import { getShellCopy } from '../content/pt';
import { isNavItemActive, isNavItemVisible, SHELL_NAV_ITEMS } from '../nav';
import { NavIcon } from '../nav-icons';
import { AtmosphereBackground } from './AtmosphereBackground';
import { TopbarActions } from './TopbarActions';
import { UserMenu } from './UserMenu';

type PlatformShellProps = {
  children: ReactNode;
  session: AppSessionData | null;
  sessionStatus: 'loading' | 'ready' | 'error';
};

function NavList({
  pathname,
  permissions,
  onNavigate,
}: {
  pathname: string;
  permissions: readonly string[];
  onNavigate?: () => void;
}) {
  const shell = getShellCopy();

  return (
    <ul className="flex flex-col gap-1 p-3">
      {SHELL_NAV_ITEMS.filter((item) => isNavItemVisible(item, permissions)).map((item) => {
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
                  ? 'bg-brand-500/25 text-white ring-1 ring-brand-400/40'
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
  );
}

function ShellBrand() {
  return (
    <div className="relative border-b border-white/10 px-4 py-5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600"
      />
      <BrandMark href="/app" tone="light" size="xl" />
      <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Gestão patrimonial
      </p>
    </div>
  );
}

/**
 * LinkedIn-style app frame (ADR-013):
 * - Left nav + top header never scroll
 * - Only the center pane scrolls
 * - Stable atmosphere — same environment across modules
 */
export function PlatformShell({ children, session, sessionStatus }: PlatformShellProps) {
  const auth = getAuthCopy();
  const shell = getShellCopy();
  const pathname = usePathname() || '/app';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleId = useId();
  const drawerId = useId();
  const drawerTitleId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  const permissionsRef = useRef<string[]>(session?.permissions ?? []);
  if (session?.permissions?.length) {
    permissionsRef.current = [...session.permissions];
  }
  const permissions = session?.permissions?.length ? session.permissions : permissionsRef.current;
  const roleLabels: Record<string, string> = {
    client: auth.onboarding.roles.client,
    patrimonial_partner: auth.onboarding.roles.partner,
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
    super_administrator: 'Superadministrador',
  };

  useEffect(() => {
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

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
          <NavList pathname={pathname} permissions={permissions} />
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
                <BrandMark href="/app" tone="light" size="lg" />
              </div>
              <p
                id={titleId}
                className="hidden truncate text-sm font-semibold tracking-wide text-slate-100 md:block"
              >
                {shell.areaTitle}
              </p>
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
            <div className="flex flex-col gap-5">{children}</div>
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
                <BrandMark href="/app" tone="light" size="xl" />
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
              <NavList
                pathname={pathname}
                permissions={permissions}
                onNavigate={() => setDrawerOpen(false)}
              />
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
