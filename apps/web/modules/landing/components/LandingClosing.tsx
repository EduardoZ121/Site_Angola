'use client';

import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import Link from 'next/link';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { Reveal } from './Reveal';
import { getLandingCopy } from '../content';

export function LandingClosing() {
  const { locale } = useLocale();
  const c = getLandingCopy(locale);
  return (
    <section
      aria-labelledby="landing-closing-title"
      className="bg-slate-900 py-20 text-white sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <h2
            id="landing-closing-title"
            className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {c.closing.phrase}
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              href={c.routes.start}
              className={cn(
                buttonVariants({ variant: 'primary', size: 'lg' }),
                'min-h-12 w-full max-w-xs justify-center sm:w-auto',
              )}
            >
              {c.closing.cta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
