'use client';

import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { landingContent } from '../content';

const c = landingContent;

export function LandingTopbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-150',
        scrolled
          ? 'border-b border-white/10 bg-slate-950/70 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {/* Decorative mark; brand name is the accessible name of the link */}
          <Image
            src="/kuteka-logo.svg"
            alt=""
            width={28}
            height={28}
            className="size-7"
            unoptimized
            priority
          />
          <span className="text-base font-semibold tracking-tight">{c.topbar.brand}</span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-3">
          <Link
            href={c.routes.enter}
            className="hidden min-h-11 items-center px-3 text-sm font-medium text-slate-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:inline-flex"
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
