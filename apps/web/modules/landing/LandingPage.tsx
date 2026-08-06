'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LandingClosing } from './components/LandingClosing';
import { LandingDifference } from './components/LandingDifference';
import { LandingFooter } from './components/LandingFooter';
import { LandingHero } from './components/LandingHero';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingTopbar } from './components/LandingTopbar';
import { getLandingCopy } from './content';

export function LandingPage() {
  const { locale } = useLocale();
  const c = getLandingCopy(locale);
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-kuteka focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow"
      >
        {c.skipToContent}
      </a>
      <LandingTopbar />
      <main id="conteudo">
        <LandingHero />
        <LandingDifference />
        <LandingHowItWorks />
        <LandingClosing />
      </main>
      <LandingFooter />
    </>
  );
}
