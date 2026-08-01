import { HERO_MEDIA, type HeroMediaPreset } from '../media/hero-media';

/**
 * Atmospheric identity strip — Landing-aligned (light type over cinematic veil).
 * Not an h1; each module owns the page heading inside glass.
 */
export function ModuleIntro({
  preset,
  compact = false,
}: {
  preset: HeroMediaPreset;
  compact?: boolean;
}) {
  const source = HERO_MEDIA[preset];
  return (
    <div className={`kuteka-module-intro${compact ? ' kuteka-module-intro--compact' : ''}`}>
      <p className="kuteka-module-intro__eyebrow">{source.eyebrow}</p>
      {!compact ? <p className="kuteka-module-intro__title">{source.title}</p> : null}
      <p className="kuteka-module-intro__subtitle">{source.subtitle}</p>
    </div>
  );
}
