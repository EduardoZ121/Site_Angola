'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { AgentDetailClient } from '@/modules/agente/components/AgentDetailClient';
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
          description="Seleccione um património no inventário do agente para activar acompanhamento."
          action={
            <Link
              href="/app/agente/explorar"
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              Explorar inventário
            </Link>
          }
        />
        <FlowNextSteps
          steps={[
            { href: '/app/agente', label: 'Área Agente', primary: true },
            { href: '/app/confianca', label: 'Verificar conta' },
          ]}
        />
      </div>
    );
  }
  return <AgentDetailClient id={id} />;
}

export default function AgenteDetalhePage() {
  return (
    <Suspense fallback={<ModuleSkeleton rows={4} />}>
      <DetailInner />
    </Suspense>
  );
}
