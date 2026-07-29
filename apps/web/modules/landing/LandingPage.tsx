import { LandingClosing } from './components/LandingClosing';
import { LandingDifference } from './components/LandingDifference';
import { LandingFooter } from './components/LandingFooter';
import { LandingHero } from './components/LandingHero';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingTopbar } from './components/LandingTopbar';

export function LandingPage() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-kuteka focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow"
      >
        Ir para o conteúdo
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
