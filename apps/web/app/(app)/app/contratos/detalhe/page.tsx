'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { ContractDetailClient } from '@/modules/contratos/components/ContractDetailClient';
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
          title="Contrato não especificado"
          description="Escolha um contrato no hub para ver partes, termos e próximos passos."
          action={
            <Link href="/app/contratos" className={cn(buttonVariants({ variant: 'primary' }))}>
              Ver contratos
            </Link>
          }
        />
        <FlowNextSteps
          steps={[
            { href: '/app/contratos', label: 'Ver contratos', primary: true },
            { href: '/app/confianca', label: 'Confiança' },
            { href: '/app', label: 'Preparar pagamento' },
          ]}
        />
      </div>
    );
  }
  return <ContractDetailClient id={id} />;
}

export default function ContratosDetalhePage() {
  return (
    <Suspense fallback={<SoftListSlot pending minHeightClassName="min-h-[16rem]" />}>
      <DetailInner />
    </Suspense>
  );
}
