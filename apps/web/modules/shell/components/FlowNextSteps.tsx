'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';

export type FlowStep = {
  href: string;
  label: string;
  primary?: boolean;
};

type FlowNextStepsProps = {
  title?: string;
  /** Orientação KAI — um próximo passo claro, não uma lista fria de botões. */
  kaiHint?: string;
  steps: FlowStep[];
  className?: string;
};

/** Continuous-journey CTAs — prefer forward motion over “Voltar”. */
export function FlowNextSteps({ title, kaiHint, steps, className }: FlowNextStepsProps) {
  const { locale } = useLocale();
  const flow = getShellCopy(locale).flowNextSteps;
  const resolvedTitle = title ?? flow.defaultTitle;
  if (!steps.length) return null;
  const primary = steps.find((s) => s.primary) ?? steps[0]!;
  const secondary = steps.filter((s) => s !== primary);

  return (
    <nav
      aria-label={resolvedTitle}
      className={cn('kuteka-detail-panel flex flex-col gap-3 p-4', className)}
    >
      <div>
        <p className="kuteka-detail-micro">{flow.kaiEyebrow}</p>
        <p className="mt-1 text-sm font-semibold text-stone-900">{resolvedTitle}</p>
        {kaiHint ? <p className="mt-1 text-sm text-stone-700">{kaiHint}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={primary.href}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
        >
          {primary.label}
        </Link>
        {secondary.map((step) => (
          <Link
            key={`${step.href}-${step.label}`}
            href={step.href}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
          >
            {step.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
