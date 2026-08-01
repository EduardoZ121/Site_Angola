'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { roleLabelPt, type AppSessionData } from '@/modules/authentication/components/app-session';
import { getAuthCopy } from '@/modules/authentication/content';
import { getShellCopy } from '../content/pt';

type UserMenuProps = {
  session: AppSessionData | null;
  sessionStatus: 'loading' | 'ready' | 'error';
  roleLabels: Record<string, string>;
};

/**
 * Topbar account menu — Perfil, Papéis, Definições (prep), Terminar sessão.
 */
export function UserMenu({ session, sessionStatus, roleLabels }: UserMenuProps) {
  const auth = getAuthCopy();
  const shell = getShellCopy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const headerName = session?.displayName || session?.email || auth.app.userFallback;
  const roleBadges = session?.roles ?? [];

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
          'flex max-w-[14rem] items-center gap-2 px-2 sm:max-w-xs',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium text-slate-800">{headerName}</span>
          {roleBadges.length > 0 ? (
            <span className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block">
              {roleBadges.map((code) => roleLabelPt(code, roleLabels)).join(' · ')}
            </span>
          ) : sessionStatus === 'ready' ? (
            <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              {auth.app.noRoles}
            </span>
          ) : null}
        </span>
        <span aria-hidden className="text-xs text-slate-500">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={shell.userMenuAria}
          className="absolute right-0 z-40 mt-2 w-56 rounded-kuteka border border-slate-200 bg-white py-1 shadow-sm"
        >
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium text-slate-800">{headerName}</p>
            {roleBadges.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {roleBadges.map((code) => (
                  <Badge key={code} variant="brand" className="text-[0.65rem]">
                    {roleLabelPt(code, roleLabels)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            role="menuitem"
            href="/auth/onboarding/perfil"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            {shell.userMenu.profile}
          </Link>
          <Link
            role="menuitem"
            href="/auth/onboarding/papeis"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            {shell.userMenu.roles}
          </Link>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-400"
          >
            <span>{shell.userMenu.settings}</span>
            <span className="text-xs font-medium">{shell.soon}</span>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <Link
            role="menuitem"
            href="/auth/sair"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            {auth.logout.action}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
