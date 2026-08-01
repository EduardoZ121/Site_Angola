'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { roleLabelPt, type AppSessionData } from '@/modules/authentication/components/app-session';
import { getAuthCopy } from '@/modules/authentication/content';
import { getShellCopy } from '../content/pt';

type UserMenuProps = {
  session: AppSessionData | null;
  sessionStatus: 'loading' | 'ready' | 'error';
  roleLabels: Record<string, string>;
};

type MenuItem = {
  href: string;
  label: string;
  hint: string;
  icon: string;
  danger?: boolean;
};

function MenuIcon({ name }: { name: string }) {
  const common = 'size-[1.15rem] shrink-0 stroke-[1.75]';
  switch (name) {
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" />
          <path
            d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'roles':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" />
          <path d="M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" />
          <path
            d="M3.5 19c.8-2.8 2.6-4 4.5-4s3.7 1.2 4.5 4"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M14 15.5c1.2-.8 2.5-1 3.8-1 1.7 0 3.2.8 4.2 2.5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'contracts':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
          />
          <path d="M14 3.5V8h4M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case 'docs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M8 4h6l4 4v12H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" />
          <path d="M10 13h4M10 16h3" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" />
          <path
            d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
          <path
            d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'contact':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeLinecap="round" />
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" />
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
          <path
            d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M13 12h7M17 8l4 4-4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Professional account menu — high contrast, icons, short descriptions.
 */
export function UserMenu({ session, sessionStatus, roleLabels }: UserMenuProps) {
  const auth = getAuthCopy();
  const shell = getShellCopy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const headerName = session?.displayName || session?.email || auth.app.userFallback;
  const roleBadges = session?.roles ?? [];
  const primaryRole =
    roleBadges.length > 0
      ? roleBadges.map((code) => roleLabelPt(code, roleLabels)).join(' · ')
      : sessionStatus === 'ready'
        ? auth.app.noRoles
        : '…';
  const initials = (session?.displayName || session?.email || 'K')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const canPartner = session?.permissions.includes('properties.manage') ?? false;

  const primaryItems: MenuItem[] = [
    {
      href: '/auth/onboarding/perfil',
      label: shell.userMenu.profile,
      hint: shell.userMenu.profileHint,
      icon: 'profile',
    },
    {
      href: '/auth/onboarding/papeis',
      label: shell.userMenu.roles,
      hint: shell.userMenu.rolesHint,
      icon: 'roles',
    },
    ...(canPartner
      ? [
          {
            href: '/app/patrimonios',
            label: shell.userMenu.patrimonios,
            hint: shell.userMenu.patrimoniosHint,
            icon: 'home',
          } satisfies MenuItem,
        ]
      : []),
    {
      href: '/app/contratos',
      label: shell.userMenu.contracts,
      hint: shell.userMenu.contractsHint,
      icon: 'contracts',
    },
    {
      href: '/app/confianca',
      label: shell.userMenu.documents,
      hint: shell.userMenu.documentsHint,
      icon: 'docs',
    },
  ];

  const secondaryItems: MenuItem[] = [
    {
      href: '/auth/onboarding/perfil',
      label: shell.userMenu.settings,
      hint: shell.userMenu.settingsHint,
      icon: 'settings',
    },
    {
      href: '/contacto',
      label: shell.userMenu.help,
      hint: shell.userMenu.helpHint,
      icon: 'help',
    },
    {
      href: '/contacto',
      label: shell.userMenu.contact,
      hint: shell.userMenu.contactHint,
      icon: 'contact',
    },
  ];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'flex max-w-[16rem] items-center gap-2.5 px-2 text-slate-100 hover:bg-white/10 sm:max-w-xs',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0a91f] text-xs font-bold text-[#08263f] ring-2 ring-white/30"
        >
          {initials || 'K'}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-white">{headerName}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-200">{primaryRole}</span>
        </span>
        <span aria-hidden className="hidden text-xs text-slate-200 sm:inline">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={shell.userMenuAria}
          className="absolute right-0 z-50 mt-2 w-[19.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f0a91f] text-sm font-bold text-[#08263f]"
            >
              {initials || 'K'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{headerName}</p>
              <p className="mt-0.5 truncate text-xs text-slate-600">{primaryRole}</p>
            </div>
          </div>

          <ul className="py-1.5">
            {primaryItems.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  role="menuitem"
                  href={item.href}
                  className="flex items-start gap-3 px-4 py-2.5 text-slate-900 transition-colors hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  <span className="mt-0.5 text-[#08263f]">{<MenuIcon name={item.icon} />}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{item.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-200" />

          <ul className="py-1.5">
            {secondaryItems.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  role="menuitem"
                  href={item.href}
                  className="flex items-start gap-3 px-4 py-2.5 text-slate-900 transition-colors hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  <span className="mt-0.5 text-[#08263f]">{<MenuIcon name={item.icon} />}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{item.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-200" />

          <Link
            role="menuitem"
            href="/auth/sair"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
            onClick={() => setOpen(false)}
          >
            <span className="text-red-600">
              <MenuIcon name="logout" />
            </span>
            {shell.userMenu.logout}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
