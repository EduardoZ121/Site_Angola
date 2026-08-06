'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { MessagesTopbarButton } from '@/modules/mensagens/components/MessagesTopbarButton';
import { getShellCopy } from '../content';
import { notificationsForMode, unreadCount } from '../notifications';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useRoleExperience } from './RoleExperienceProvider';

/** Topbar: language + role-aware notifications. */
export function TopbarActions() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const { mode } = useRoleExperience();
  const items = notificationsForMode(mode, locale);
  const count = unreadCount(items);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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

  useEffect(() => {
    setOpen(false);
  }, [mode, locale]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <LanguageSwitcher variant="compact" />

      <MessagesTopbarButton />

      <div ref={rootRef} className="relative">
        <button
          type="button"
          title={shell.notificationsTitle}
          aria-label={`${shell.notificationsTitle}${count ? ` (${count})` : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'relative px-2 text-slate-100 hover:bg-white/10',
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
            <path
              d="M10 3.2a4 4 0 0 0-4 4v2.2c0 .7-.3 1.4-.8 1.9L4 12.8h12l-1.2-1.5c-.5-.5-.8-1.2-.8-1.9V7.2a4 4 0 0 0-4-4Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M8.5 15a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {count > 0 ? (
            <span className="kuteka-notif-badge" aria-hidden>
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>

        {open ? (
          <div id={panelId} className="kuteka-account-panel kuteka-notif-panel" role="dialog">
            <div className="kuteka-account-panel__head">
              <p className="kuteka-account-panel__title">{shell.notificationsTitle}</p>
              <p className="kuteka-account-panel__meta">
                {count > 0 ? `${count}` : shell.notificationsEmpty}
              </p>
            </div>
            <div className="kuteka-account-panel__scroll">
              {items.length === 0 ? (
                <p className="kuteka-account-item__hint px-4 py-3">{shell.notificationsEmpty}</p>
              ) : (
                <ul className="flex flex-col">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="kuteka-notif-item"
                        onClick={() => setOpen(false)}
                      >
                        <span className="kuteka-notif-item__title">{item.title}</span>
                        <span className="kuteka-notif-item__body">{item.body}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
