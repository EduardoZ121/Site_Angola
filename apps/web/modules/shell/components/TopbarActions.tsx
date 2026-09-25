'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { MessagesTopbarButton } from '@/modules/mensagens/components/MessagesTopbarButton';
import { getShellCopy } from '../content';
import { noticeStatus, unreadCount, type NoticeStatus, type ShellNotification } from '../notifications';
import { applyStoredStatus, isNoticeUuid, rememberNoticeStatus } from '../notification-state';
import { archiveMyNotifications, fetchMyNotifications, markMyNotificationsRead } from '../services/notifications-client';
import { fetchLiveNotices } from '../services/live-notices';
import { LanguageSwitcher } from './LanguageSwitcher';
import { isInsidePopover, ViewportPopover } from './ViewportPopover';
import { useRoleExperience } from './RoleExperienceProvider';

/** Topbar: language + avisos reais (base e dados visíveis). Sem catálogo inventado. */
export function TopbarActions() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const { mode } = useRoleExperience();
  const [dbItems, setDbItems] = useState<ShellNotification[]>([]);
  const [liveItems, setLiveItems] = useState<ShellNotification[]>([]);
  const [storedTick, setStoredTick] = useState(0);
  const [filter, setFilter] = useState<'open' | 'unread' | 'action' | 'archived'>('open');
  const items = useMemo(() => {
    const seen = new Set(dbItems.map((item) => item.id));
    return applyStoredStatus([...dbItems, ...liveItems.filter((item) => !seen.has(item.id))]);
  }, [dbItems, liveItems, storedTick]);
  const visible = items.filter((item) => {
    const status = noticeStatus(item);
    if (filter === 'archived') return status === 'archived';
    if (filter === 'unread') return status === 'unread';
    if (filter === 'action') return status === 'action';
    return status !== 'archived';
  });
  const count = unreadCount(items);
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchMyNotifications(20), fetchLiveNotices()]).then(([rows, live]) => {
      if (!cancelled) {
        setDbItems(rows);
        setLiveItems(live);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mode, locale]);

  useEffect(() => {
    setOpen(false);
    setFeedbackOpen(false);
  }, [mode, locale]);

  function persist(id: string, status: NoticeStatus) {
    rememberNoticeStatus(id, status);
    setStoredTick((value) => value + 1);
    if (!isNoticeUuid(id)) return;
    if (status === 'archived') void archiveMyNotifications([id]);
    if (status === 'read') void markMyNotificationsRead([id]);
  }

  function markAllRead() {
    const ids = items.filter((item) => noticeStatus(item) === 'unread').map((item) => item.id);
    for (const id of ids) rememberNoticeStatus(id, 'read');
    setStoredTick((value) => value + 1);
    const remote = ids.filter(isNoticeUuid);
    if (remote.length) void markMyNotificationsRead(remote);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (rootRef.current?.contains(target as Node) || isInsidePopover(target)) return;
      setOpen(false);
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
    if (!feedbackOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (feedbackRef.current?.contains(target as Node) || isInsidePopover(target)) return;
      setFeedbackOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFeedbackOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [feedbackOpen]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <LanguageSwitcher variant="compact" />

      <div ref={feedbackRef} className="relative">
        <button
          type="button"
          title="Feedback"
          aria-label="Feedback"
          aria-expanded={feedbackOpen}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'px-2 text-slate-100 hover:bg-white/10',
          )}
          onClick={() => {
            setOpen(false);
            setFeedbackOpen((value) => !value);
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
            <path
              d="M4 4.5h12v8.2H8.2L4 16.2V4.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ViewportPopover open={feedbackOpen} anchorRef={feedbackRef} label="Feedback">
          <div className="kuteka-account-panel__head">
            <div>
              <p className="kuteka-account-panel__title">Feedback</p>
              <p className="kuteka-account-panel__meta">Problema, ideia ou captura. Não sai do ecrã.</p>
            </div>
          </div>
          <div className="kuteka-account-panel__scroll px-4 py-3 text-sm text-slate-700">
            <p>O formulário completo, com texto e o caminho da página, está no Centro de Ajuda.</p>
            <Link
              href="/app/ajuda?sec=estado#feedback-beta"
              className="mt-3 inline-flex font-semibold text-brand-700 underline"
              onClick={() => setFeedbackOpen(false)}
            >
              Abrir feedback
            </Link>
          </div>
        </ViewportPopover>
      </div>

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
          <ViewportPopover
            open={open}
            anchorRef={rootRef}
            id={panelId}
            label={shell.notificationsTitle}
          >
            <div className="kuteka-account-panel__head">
              <div className="min-w-0">
                <p className="kuteka-account-panel__title">{shell.notificationsTitle}</p>
                <p className="kuteka-account-panel__meta">
                  {count > 0 ? `${count} ${shell.notificationsUnread.toLowerCase()}` : shell.notificationsEmpty}
                </p>
              </div>
              {count > 0 ? (
                <button type="button" className="text-xs font-semibold text-brand-700" onClick={markAllRead}>
                  {shell.notificationsMarkRead}
                </button>
              ) : null}
            </div>
            <div className="flex gap-1 overflow-x-auto px-3 py-2">
              {(
                [
                  ['open', shell.notificationsOpen],
                  ['unread', shell.notificationsUnread],
                  ['action', shell.notificationsAction],
                  ['archived', shell.notificationsArchived],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={
                    filter === key
                      ? 'shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white'
                      : 'shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700'
                  }
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="kuteka-account-panel__scroll">
              {visible.length === 0 ? (
                <p className="kuteka-account-item__hint px-4 py-3">{shell.notificationsEmpty}</p>
              ) : (
                <ul className="flex flex-col">
                  {visible.map((item) => {
                    const status = noticeStatus(item);
                    const label =
                      status === 'unread'
                        ? shell.notificationsUnread
                        : status === 'action'
                          ? shell.notificationsAction
                          : status === 'archived'
                            ? shell.notificationsArchived
                            : shell.notificationsRead;
                    return (
                      <li key={item.id} className="border-b border-slate-200">
                        <Link
                          href={item.href}
                          className="kuteka-notif-item"
                          onClick={() => {
                            if (status === 'unread') persist(item.id, 'read');
                            setOpen(false);
                          }}
                        >
                          <span className="kuteka-notif-item__title">
                            {item.audience ? `${item.audience} · ${item.title}` : item.title}
                          </span>
                          <span className="kuteka-notif-item__body">{item.body}</span>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {label}
                          </span>
                        </Link>
                        {status !== 'archived' ? (
                          <button
                            type="button"
                            className="px-4 pb-2 text-xs font-semibold text-slate-600"
                            onClick={() => persist(item.id, 'archived')}
                          >
                            {shell.notificationsArchive}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </ViewportPopover>
        ) : null}
      </div>
    </div>
  );
}
