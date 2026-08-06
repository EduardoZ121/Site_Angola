'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getMensagensCopy } from '../content';
import {
  listConversations,
  unreadTotal,
  type ChatConversationSummary,
} from '../services/chat-client';

/** Topbar entry point for Kuteka Chat — icon + unread badge + preview dropdown. */
export function MessagesTopbarButton() {
  const { locale } = useLocale();
  const copy = getMensagensCopy(locale);
  const { status: sessionStatus } = useAppSession();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState<ChatConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (sessionStatus !== 'ready') return;
    let cancelled = false;
    async function refreshCount() {
      const result = await unreadTotal();
      if (!cancelled && result.ok) setCount(result.data);
    }
    void refreshCount();
    const interval = window.setInterval(refreshCount, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionStatus]);

  useEffect(() => {
    if (!open || sessionStatus !== 'ready') return;
    let cancelled = false;
    setLoading(true);
    void listConversations().then((result) => {
      if (cancelled) return;
      if (result.ok) setPreview(result.data.slice(0, 5));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, sessionStatus]);

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

  if (sessionStatus !== 'ready') return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title={copy.topbar.title}
        aria-label={`${copy.topbar.title}${count ? ` (${count} ${copy.unreadBadgeAria})` : ''}`}
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
            d="M3.5 5.8A2.3 2.3 0 0 1 5.8 3.5h8.4a2.3 2.3 0 0 1 2.3 2.3v5.4a2.3 2.3 0 0 1-2.3 2.3H8.6l-3.4 2.8v-2.8H5.8a2.3 2.3 0 0 1-2.3-2.3V5.8Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
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
            <p className="kuteka-account-panel__title">{copy.topbar.title}</p>
            <p className="kuteka-account-panel__meta">
              {count > 0 ? `${count}` : copy.topbar.empty}
            </p>
          </div>
          <div className="kuteka-account-panel__scroll">
            {loading ? (
              <p className="kuteka-account-item__hint px-4 py-3">{copy.topbar.loading}</p>
            ) : preview.length === 0 ? (
              <p className="kuteka-account-item__hint px-4 py-3">{copy.topbar.empty}</p>
            ) : (
              <ul className="flex flex-col">
                {preview.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/app/mensagens?c=${encodeURIComponent(item.id)}`}
                      className="kuteka-notif-item"
                      onClick={() => setOpen(false)}
                    >
                      <span className="kuteka-notif-item__title">
                        {item.peer_name}
                        {item.unread_count > 0 ? ` · ${item.unread_count}` : ''}
                      </span>
                      <span className="kuteka-notif-item__body">
                        {item.last_preview || copy.selectConversation}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-200 px-3 py-2">
            <Link
              href="/app/mensagens"
              className="block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
              onClick={() => setOpen(false)}
            >
              {copy.topbar.viewAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
