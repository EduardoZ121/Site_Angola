'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getMensagensCopy } from '../content';
import { startDirect } from '../services/chat-client';

type MessagePropertyOwnerButtonProps = {
  propertyId: string;
  ownerId: string | null | undefined;
  propertyTitle?: string | null;
  className?: string;
};

/**
 * Secondary "Mensagem" CTA for property detail pages (HousingDetailClient,
 * PropertyDetailClient). Best-effort: only renders once we know the owner id
 * and the viewer isn't the owner themselves. Server RPC (kuteka_chat_can_pair)
 * remains the source of truth for role pairing — this button soft-fails with
 * an inline message when the pairing is rejected instead of throwing.
 */
export function MessagePropertyOwnerButton({
  propertyId,
  ownerId,
  propertyTitle,
  className,
}: MessagePropertyOwnerButtonProps) {
  const { locale } = useLocale();
  const copy = getMensagensCopy(locale);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(
    null,
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadViewer() {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!cancelled) setViewerId(user?.id ?? null);
      } catch {
        if (!cancelled) setViewerId(null);
      }
    }
    void loadViewer();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ownerId || (viewerId && viewerId === ownerId)) return null;

  async function onClick() {
    setBusy(true);
    setFeedback(null);
    const result = await startDirect({
      peerUserId: ownerId!,
      contextType: 'property',
      propertyId,
      title: propertyTitle ? `${copy.contextLabels.property} · ${propertyTitle}` : null,
    });
    setBusy(false);
    if (!result.ok) {
      setFeedback({ tone: 'error', text: result.message });
      return;
    }
    setConversationId(result.data);
    setFeedback({ tone: 'success', text: copy.cta.messageSent });
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button type="button" variant="secondary" disabled={busy} onClick={() => void onClick()}>
        {busy ? copy.cta.messageBusy : copy.cta.messageOwner}
      </Button>
      {feedback ? (
        <p
          role="status"
          className={cn(
            'rounded-kuteka px-3 py-2 text-xs',
            feedback.tone === 'error'
              ? 'border border-amber-200 bg-amber-50 text-amber-950'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-950',
          )}
        >
          {feedback.text}{' '}
          {feedback.tone === 'success' && conversationId ? (
            <Link
              href={`/app/mensagens?c=${encodeURIComponent(conversationId)}`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'ml-1 h-auto px-1 py-0 underline',
              )}
            >
              {copy.cta.openInbox}
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
