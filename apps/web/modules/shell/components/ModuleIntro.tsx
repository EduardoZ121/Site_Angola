import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

/**
 * Atmospheric identity copy over the full-bleed background.
 * Uses a paragraph (not h1) so each module keeps a single page heading.
 */
export function ModuleIntro({ preset }: { preset: HeroMediaPreset }) {
  const source = HERO_MEDIA[preset];
  return (
    <div className="kuteka-module-intro mb-6 sm:mb-8">
      <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-brand-800 uppercase sm:text-xs">
        {source.eyebrow}
      </p>
      <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {source.title}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-800 sm:text-base">
        {source.subtitle}
      </p>
    </div>
  );
}
