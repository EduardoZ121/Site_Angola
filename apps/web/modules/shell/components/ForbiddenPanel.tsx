'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
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
  primaryLabel,
  steps,
}: ForbiddenPanelProps) {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const label = primaryLabel ?? shell.forbidden.activateRole;
  const nextSteps =
    steps ??
    ([
      { href: '/app', label: shell.forbidden.goDashboard, primary: true },
      { href: '/app/confianca', label: shell.forbidden.verifyAccount },
    ] satisfies FlowStep[]);

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
          {label}
        </Link>
      </div>
      <FlowNextSteps title={shell.forbidden.continueElsewhere} steps={nextSteps} />
    </div>
  );
}
