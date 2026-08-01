'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PropertyDetailClient } from '@/modules/patrimonios/components/PropertyDetailClient';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';

function DetailInner() {
  const params = useSearchParams();
  const id = params.get('id');
  if (!id) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          title="Património não especificado"
          description="Abra um património a partir da lista para ver a ficha completa."
          action={
            <Link href="/app/patrimonios" className={cn(buttonVariants({ variant: 'primary' }))}>
              Ver patrimónios
            </Link>
          }
        />
        <FlowNextSteps
          steps={[
            { href: '/app/patrimonios/novo', label: 'Publicar património', primary: true },
            { href: '/app/confianca', label: 'Verificar conta' },
          ]}
        />
      </div>
    );
  }
  return <PropertyDetailClient id={id} />;
}

export default function PatrimonioDetalhePage() {
  return (
    <Suspense fallback={<ModuleSkeleton rows={4} />}>
      <DetailInner />
    </Suspense>
  );
}
