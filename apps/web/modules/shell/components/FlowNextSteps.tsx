import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

export type FlowStep = {
  href: string;
  label: string;
  primary?: boolean;
};

type FlowNextStepsProps = {
  title?: string;
  steps: FlowStep[];
  className?: string;
};

/** Continuous-journey CTAs — prefer forward motion over “Voltar”. */
export function FlowNextSteps({
  title = 'Continuar o percurso',
  steps,
  className,
}: FlowNextStepsProps) {
  if (!steps.length) return null;
  return (
    <nav
      aria-label={title}
      className={cn(
        'kuteka-glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <Link
            key={`${step.href}-${step.label}`}
            href={step.href}
            className={cn(
              buttonVariants({ variant: step.primary ? 'primary' : 'secondary', size: 'sm' }),
              'w-fit',
            )}
          >
            {step.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
