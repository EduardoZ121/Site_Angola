'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Text } from '@kuteka/ui';
import { AgentDetailClient } from '@/modules/agente/components/AgentDetailClient';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id');
  if (!id) {
    return <Text className="text-slate-600">Património não especificado.</Text>;
  }
  return <AgentDetailClient id={id} />;
}

export default function AgenteDetalhePage() {
  return (
    <Suspense fallback={<Text className="text-slate-500">A carregar…</Text>}>
      <DetailInner />
    </Suspense>
  );
}
