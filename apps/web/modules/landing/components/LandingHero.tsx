import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import Image from 'next/image';
import Link from 'next/link';
import { landingContent } from '../content';

const c = landingContent;

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-hero-title"
      className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-28 sm:items-center sm:pb-24 sm:pt-32"
    >
      <Image
        src="/images/hero.jpg"
        alt={c.hero.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/55"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl space-y-6 sm:max-w-2xl">
          <p className="landing-hero-item font-mono text-xs font-medium tracking-[0.14em] text-brand-400 uppercase sm:text-sm">
            {c.hero.eyebrow}
          </p>
          <h1
            id="landing-hero-title"
            className="landing-hero-item landing-hero-delay-1 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.08] tracking-tight text-white"
          >
            {c.hero.title}
          </h1>
          <p className="landing-hero-item landing-hero-delay-2 max-w-[42ch] text-base leading-relaxed text-slate-300 sm:text-lg">
            {c.hero.subtitle}
          </p>
          <div className="landing-hero-item landing-hero-delay-3 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={c.routes.start}
              className={cn(
                buttonVariants({ variant: 'primary', size: 'lg' }),
                'min-h-12 w-full justify-center sm:w-auto',
              )}
            >
              {c.hero.primaryCta}
            </Link>
            <a
              href={c.routes.exploreHash}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'min-h-12 w-full justify-center border-white/35 bg-transparent text-white hover:bg-white/10 sm:w-auto',
              )}
            >
              {c.hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
