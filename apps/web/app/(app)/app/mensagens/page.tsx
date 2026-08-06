'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MessagesInboxClient } from '@/modules/mensagens/components/MessagesInboxClient';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';

function MensagensInner() {
  const params = useSearchParams();
  const conversationId = params.get('c');
  return <MessagesInboxClient initialConversationId={conversationId} />;
}

export default function MensagensPage() {
  return (
    <Suspense fallback={<SoftListSlot pending minHeightClassName="min-h-[24rem]" />}>
      <MensagensInner />
    </Suspense>
  );
}
