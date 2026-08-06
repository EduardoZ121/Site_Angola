'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Heading, Text, Textarea } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getMensagensCopy } from '../content';
import { canReleaseContacts, roleLabel } from '../lib/contact-policy';
import {
  getThread,
  listConversations,
  markRead,
  sendMessage,
  setStatus,
  type ChatConversationStatus,
  type ChatConversationSummary,
  type ChatThread,
} from '../services/chat-client';

type StatusFilter = 'all' | ChatConversationStatus;

function statusVariant(status: ChatConversationStatus): 'default' | 'success' | 'brand' {
  if (status === 'active') return 'success';
  if (status === 'completed') return 'brand';
  return 'default';
}

function formatWhen(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(
      LOCALE_INTL_TAG[locale as keyof typeof LOCALE_INTL_TAG] ?? 'pt-AO',
      {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  } catch {
    return iso;
  }
}

export function MessagesInboxClient({
  initialConversationId,
}: {
  initialConversationId?: string | null;
}) {
  const { locale } = useLocale();
  const copy = getMensagensCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();

  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [composerValue, setComposerValue] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openedInitial = useRef(false);

  async function refreshList(nextQuery?: string) {
    setLoadingList(true);
    const result = await listConversations(nextQuery ?? query);
    setLoadingList(false);
    if (!result.ok) {
      setListError(result.message);
      return;
    }
    setListError(null);
    setConversations(result.data);
  }

  useEffect(() => {
    if (sessionStatus === 'ready') void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when session becomes ready
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== 'ready') return;
    const handle = window.setTimeout(() => void refreshList(query), 280);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search only
  }, [query, sessionStatus]);

  async function openConversation(id: string) {
    setSelectedId(id);
    setThreadError(null);
    setLoadingThread(true);
    const result = await getThread(id);
    setLoadingThread(false);
    if (!result.ok) {
      setThreadError(result.message);
      setThread(null);
      return;
    }
    setThread(result.data);
    void markRead(id).then(() => refreshList());
  }

  useEffect(() => {
    if (sessionStatus === 'ready' && initialConversationId && !openedInitial.current) {
      openedInitial.current = true;
      void openConversation(initialConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open the deep-linked conversation once
  }, [sessionStatus, initialConversationId]);

  async function submitMessage() {
    if (!selectedId) return;
    const body = composerValue.trim();
    if (!body) return;
    setSending(true);
    setToast(null);
    const result = await sendMessage({ conversationId: selectedId, body, kind: 'text' });
    setSending(false);
    if (!result.ok) {
      setToast(result.message);
      return;
    }
    setComposerValue('');
    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, result.data] } : prev));
    void refreshList();
  }

  function onSend(event: React.FormEvent) {
    event.preventDefault();
    void submitMessage();
  }

  async function onChangeStatus(next: ChatConversationStatus) {
    if (!selectedId) return;
    setStatusBusy(true);
    setToast(null);
    const result = await setStatus({ conversationId: selectedId, status: next });
    setStatusBusy(false);
    if (!result.ok) {
      setToast(result.message);
      return;
    }
    setThread((prev) =>
      prev ? { ...prev, conversation: { ...prev.conversation, status: next } } : prev,
    );
    void refreshList();
  }

  const filteredConversations = useMemo(
    () => conversations.filter((c) => statusFilter === 'all' || c.status === statusFilter),
    [conversations, statusFilter],
  );

  const selectedSummary = conversations.find((c) => c.id === selectedId) ?? null;
  const contractActive = thread?.conversation.contacts_released ?? false;
  const canManageStatus =
    !!selectedId &&
    (!!thread?.participants.some((p) => p.is_self) ||
      (sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel')));

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-glass flex flex-col gap-2 p-5">
          <Heading level={1}>{copy.title}</Heading>
          <Text className="text-slate-600">{copy.subtitle}</Text>
        </header>

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr] lg:items-start">
          <section
            className={cn(
              'kuteka-detail-panel flex flex-col gap-3 p-3',
              selectedId ? 'hidden lg:flex' : 'flex',
            )}
            aria-label={copy.inboxTitle}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="flex h-10 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label={copy.searchPlaceholder}
            />

            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={copy.inboxTitle}>
              {(['all', 'active', 'archived', 'completed'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    statusFilter === key
                      ? 'bg-brand-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {copy.statusFilters[key]}
                </button>
              ))}
            </div>

            <SoftListSlot
              pending={loadingList && conversations.length === 0}
              minHeightClassName="min-h-[10rem]"
            >
              {listError ? (
                <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  {listError}
                </p>
              ) : null}
              {!loadingList && !listError && filteredConversations.length === 0 ? (
                <EmptyState
                  title={copy.emptyTitle}
                  description={conversations.length === 0 ? copy.empty : copy.emptyFiltered}
                />
              ) : null}
              {filteredConversations.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {filteredConversations.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void openConversation(item.id)}
                        className={cn(
                          'flex w-full flex-col gap-1 rounded-kuteka px-3 py-2 text-left transition hover:bg-slate-50',
                          selectedId === item.id && 'bg-brand-50 ring-1 ring-brand-200',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {item.peer_name}
                          </span>
                          {item.unread_count > 0 ? (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[0.65rem] font-bold text-white">
                              {item.unread_count > 9 ? '9+' : item.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <span className="truncate text-xs text-slate-500">
                          {item.last_preview || copy.selectConversation}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(item.status)} className="text-[0.65rem]">
                            {copy.statuses[item.status]}
                          </Badge>
                          <span className="text-[0.65rem] text-slate-400">
                            {formatWhen(item.last_message_at, locale)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </SoftListSlot>
          </section>

          <section
            className={cn(
              'kuteka-detail-panel flex min-h-[24rem] flex-col gap-3 p-4',
              selectedId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {!selectedId ? (
              <EmptyState title={copy.inboxTitle} description={copy.selectConversation} />
            ) : (
              <>
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="w-fit text-xs font-semibold text-brand-700 hover:text-brand-800 lg:hidden"
                  >
                    ← {copy.backToList}
                  </button>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedSummary?.peer_name ?? copy.inboxTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roleLabel(
                          copy,
                          selectedSummary?.peer_role ??
                            thread?.participants.find((p) => !p.is_self)?.role,
                        )}
                        {thread ? ` · ${copy.contextLabels[thread.conversation.context_type]}` : ''}
                      </p>
                    </div>
                    {thread ? (
                      <Badge variant={statusVariant(thread.conversation.status)}>
                        {copy.statuses[thread.conversation.status]}
                      </Badge>
                    ) : null}
                  </div>
                  {canManageStatus && thread ? (
                    <div className="flex flex-wrap gap-2">
                      {thread.conversation.status !== 'archived' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={statusBusy}
                          onClick={() => void onChangeStatus('archived')}
                        >
                          {copy.archive}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={statusBusy}
                          onClick={() => void onChangeStatus('active')}
                        >
                          {copy.reopen}
                        </Button>
                      )}
                      {thread.conversation.status !== 'completed' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={statusBusy}
                          onClick={() => void onChangeStatus('completed')}
                        >
                          {copy.complete}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="rounded-kuteka bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {canReleaseContacts({ contractActive })
                      ? copy.contactPolicy.shareUnlocked
                      : copy.contactPolicy.shareLocked}
                  </p>
                </div>

                <SoftListSlot pending={loadingThread && !thread} minHeightClassName="min-h-[12rem]">
                  {threadError ? (
                    <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      {threadError}
                    </p>
                  ) : null}
                  {thread ? (
                    <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
                      {thread.messages.map((message) => (
                        <li
                          key={message.id}
                          className={cn('flex', message.is_self ? 'justify-end' : 'justify-start')}
                        >
                          {message.kind === 'system' ? (
                            <p className="mx-auto rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                              {message.body}
                            </p>
                          ) : (
                            <div
                              className={cn(
                                'max-w-[80%] rounded-kuteka px-3 py-2 text-sm',
                                message.is_self
                                  ? 'bg-brand-700 text-white'
                                  : 'bg-slate-100 text-slate-900',
                                (message.kind === 'contact_request' ||
                                  message.kind === 'contact_share') &&
                                  'border border-amber-300',
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                              <p
                                className={cn(
                                  'mt-1 text-[0.65rem]',
                                  message.is_self ? 'text-brand-100' : 'text-slate-400',
                                )}
                              >
                                {formatWhen(message.created_at, locale)}
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </SoftListSlot>

                {toast ? (
                  <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    {toast}
                  </p>
                ) : null}

                <form
                  onSubmit={onSend}
                  className="flex flex-col gap-2 border-t border-slate-200 pt-3"
                >
                  <Textarea
                    value={composerValue}
                    onChange={(e) => setComposerValue(e.target.value)}
                    placeholder={copy.composerPlaceholder}
                    rows={2}
                    maxLength={4000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void submitMessage();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={sending || !composerValue.trim()}
                    className="w-fit self-end"
                  >
                    {sending ? copy.sending : copy.send}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </SessionStatusGate>
  );
}
