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
              'hidden min-h-11 items-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:inline-flex',
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
    </header>
  );
}
