/**
 * @deprecated Banner cards are no longer used.
 * Atmosphere lives in PlatformShell via AtmosphereBackground (stable app mode — ADR-013).
 * Kept as a thin re-export so accidental imports fail closed to ModuleIntro.
 */
export { ModuleIntro as HeroMedia } from './ModuleIntro';
export type { HeroMediaPreset } from '../media/hero-media';
