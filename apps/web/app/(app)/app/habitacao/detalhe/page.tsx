'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { HousingDetailClient } from '@/modules/habitacao/components/HousingDetailClient';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id');
  if (!id) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          title="Habitação não especificada"
          description="Escolha um anúncio na exploração para ver detalhes e demonstrar interesse."
          action={
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              Explorar habitação
            </Link>
          }
        />
        <FlowNextSteps
          steps={[
            { href: '/app/habitacao/explorar', label: 'Explorar inventário', primary: true },
            { href: '/app/confianca', label: 'Verificar conta' },
          ]}
        />
      </div>
    );
  }
  return <HousingDetailClient id={id} />;
}

export default function HabitacaoDetalhePage() {
  return (
    <Suspense fallback={<SoftListSlot pending minHeightClassName="min-h-[16rem]" />}>
      <DetailInner />
    </Suspense>
  );
}
