'use client';

import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/modules/authentication/components/BrandMark';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getLandingCopy } from '../content';

/**
 * Topbar: transparent over hero → glass on scroll.
 * Past the hero, switches to a light glass so it stays discreet on white sections (PASSO 1 §A).
 * Includes a slim public Beta notice row (Sprint A P0) — not a hero overlay.
 */
export function LandingTopbar() {
  const { locale } = useLocale();
  const c = getLandingCopy(locale);
  const [scrolled, setScrolled] = useState(false);
  const [overLight, setOverLight] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Approximate first viewport — light sections begin after hero
      setOverLight(y > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const light = overLight;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,color] duration-150',
        scrolled
          ? light
            ? 'border-b border-slate-200/80 bg-white/80 text-slate-900 backdrop-blur-md'
            : 'border-b border-white/10 bg-slate-950/70 text-white backdrop-blur-md'
          : 'border-b border-transparent bg-transparent text-white',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Official lockup on white plate — navy mark stays visible on dark hero */}
        <BrandMark href="/" tone={light ? 'dark' : 'light'} size="sm" variant="inline" />

        <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-3">
          <Link
            href={c.routes.enter}
            className={cn(
              'inline-flex min-h-11 items-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              light ? 'text-slate-600 hover:text-slate-900' : 'text-slate-200 hover:text-white',
            )}
          >
            {c.topbar.enter}
          </Link>
          <Link
            href={c.routes.start}
            className={cn(
              buttonVariants({ variant: 'primary', size: 'sm' }),
              'min-h-11 px-4 text-sm',
            )}
          >
            {c.topbar.start}
          </Link>
        </nav>
      </div>

      {c.betaNotice ? (
        <div
          role="status"
          className={cn(
            'border-t',
            light
              ? 'border-slate-200/80 bg-slate-50/90 text-slate-800'
              : 'border-white/10 bg-slate-950/55 text-slate-100',
          )}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <p className="text-xs leading-snug sm:text-sm">
              <span className="font-semibold">{c.betaNotice.label}</span>
              <span className="mx-1.5 opacity-60" aria-hidden>
                ·
              </span>
              {c.betaNotice.text}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <Link
                href={c.routes.start}
                className="font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {c.betaNotice.primaryCta}
              </Link>
              <Link
                href={c.betaNotice.docsHref}
                className="opacity-90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {c.betaNotice.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
