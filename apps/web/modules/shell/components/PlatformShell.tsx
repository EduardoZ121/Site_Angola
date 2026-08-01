'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { BrandMark } from '@/modules/authentication/components/BrandMark';
import type { AppSessionData } from '@/modules/authentication/components/app-session';
import { getAuthCopy } from '@/modules/authentication/content';
import { getShellCopy } from '../content/pt';
import { isNavItemActive, isNavItemVisible, SHELL_NAV_ITEMS } from '../nav';
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
                <span>{label}</span>
                <span className="text-xs font-medium text-slate-400">{shell.soon}</span>
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
                'flex items-center rounded-kuteka px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                active
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Authenticated platform chrome — Sidebar + Topbar + Main (Fase 3 D1/D6/D7).
 */
export function PlatformShell({ children, session, sessionStatus }: PlatformShellProps) {
  const auth = getAuthCopy();
  const shell = getShellCopy();
  const pathname = usePathname() || '/app';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleId = useId();
  const drawerId = useId();

  const permissions = session?.permissions ?? [];
  const roleLabels: Record<string, string> = {
    client: auth.onboarding.roles.client,
    patrimonial_partner: auth.onboarding.roles.partner,
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
  };
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex lg:w-60"
        aria-label={shell.navAria}
      >
        <div className="border-b border-slate-100 px-4 py-4">
          <BrandMark href="/app" tone="dark" />
        </div>
        <nav className="flex-1 overflow-y-auto" aria-label={shell.navAria}>
          <NavList pathname={pathname} permissions={permissions} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'md:hidden shrink-0 px-2',
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
                <BrandMark href="/app" tone="dark" />
              </div>
              <p
                id={titleId}
                className="hidden truncate text-sm font-medium text-slate-600 md:block"
              >
                {shell.areaTitle}
              </p>
            </div>

            <UserMenu session={session} sessionStatus={sessionStatus} roleLabels={roleLabels} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 transition-opacity duration-200"
            aria-label={shell.closeMenu}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            id={drawerId}
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-white shadow-lg motion-reduce:transition-none"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <BrandMark href="/app" tone="dark" />
              <button
                type="button"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-2')}
                onClick={() => setDrawerOpen(false)}
              >
                {shell.closeMenu}
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto" aria-label={shell.navAria}>
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
