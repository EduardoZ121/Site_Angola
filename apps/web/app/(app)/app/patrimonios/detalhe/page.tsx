'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Text } from '@kuteka/ui';
import { PropertyDetailClient } from '@/modules/patrimonios/components/PropertyDetailClient';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id');
  if (!id) {
    return <Text className="text-slate-600">Património não especificado.</Text>;
  }
  return <PropertyDetailClient id={id} />;
}

export default function PatrimonioDetalhePage() {
  return (
    <Suspense fallback={<Text className="text-slate-500">A carregar…</Text>}>
      <DetailInner />
    </Suspense>
  );
}
