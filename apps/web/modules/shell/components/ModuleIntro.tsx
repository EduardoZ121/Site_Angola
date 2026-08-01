import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

/**
 * Atmospheric identity strip over the full-bleed background.
 * Eyebrow + supporting line only — module H1 owns the page title (Core v1.0).
 */
export function ModuleIntro({ preset }: { preset: HeroMediaPreset }) {
  const source = HERO_MEDIA[preset];
  return (
    <div className="kuteka-module-intro mb-5 sm:mb-6">
      <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-brand-800 uppercase sm:text-xs">
        {source.eyebrow}
      </p>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-[0.95rem]">
        {source.subtitle}
      </p>
    </div>
  );
}
