'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { FlowNextSteps, type FlowStep } from './FlowNextSteps';

type ForbiddenPanelProps = {
  message: string;
  primaryHref?: string;
  primaryLabel?: string;
  steps?: FlowStep[];
};

/** Permission wall with recovery path — never a dead-end. */
export function ForbiddenPanel({
  message,
  primaryHref = '/auth/onboarding/papeis',
  primaryLabel = 'Activar papel',
  steps = [
    { href: '/app', label: 'Ir ao painel', primary: true },
    { href: '/app/confianca', label: 'Verificar conta' },
  ],
}: ForbiddenPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        role="alert"
        className="rounded-kuteka border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950"
      >
        <p>{message}</p>
        <Link
          href={primaryHref}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 inline-flex')}
        >
          {primaryLabel}
        </Link>
      </div>
      <FlowNextSteps title="Continuar noutro caminho" steps={steps} />
    </div>
  );
}
