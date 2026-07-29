import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import Link from 'next/link';
import { Reveal } from './Reveal';
import { landingContent } from '../content';

const c = landingContent;

export function LandingHowItWorks() {
  return (
    <section
      id={c.howItWorks.id}
      aria-labelledby="landing-how-title"
      className="scroll-mt-20 bg-slate-50 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2
            id="landing-how-title"
            className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
          >
            {c.howItWorks.title}
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:mt-16 sm:grid-cols-3 sm:gap-8">
          {c.howItWorks.steps.map((step, index) => (
            <li key={step.n}>
              <Reveal delayMs={index * 40}>
                <article className="space-y-3 text-center sm:text-left">
                  <p className="font-mono text-sm font-medium tracking-widest text-brand-600">
                    {step.n}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{step.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal>
          <div className="mt-12 flex justify-center">
            <Link
              href={c.routes.start}
              className={cn(
                buttonVariants({ variant: 'primary', size: 'lg' }),
                'min-h-12 w-full max-w-xs justify-center sm:w-auto',
              )}
            >
              {c.howItWorks.cta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
