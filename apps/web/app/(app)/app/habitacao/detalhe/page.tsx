'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Text } from '@kuteka/ui';
import { HousingDetailClient } from '@/modules/habitacao/components/HousingDetailClient';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id');
  if (!id) {
    return <Text className="text-slate-600">Habitação não especificada.</Text>;
  }
  return <HousingDetailClient id={id} />;
}

export default function HabitacaoDetalhePage() {
  return (
    <Suspense fallback={<Text className="text-slate-500">A carregar…</Text>}>
      <DetailInner />
    </Suspense>
  );
}
