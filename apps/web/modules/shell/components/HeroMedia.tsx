'use client';

/**
 * @deprecated Banner cards are no longer used.
 * Atmosphere lives in PlatformShell via AtmosphereBackground + ModuleIntro.
 * Kept as a thin re-export so accidental imports fail closed to ModuleIntro.
 */
export { ModuleIntro as HeroMedia } from './ModuleIntro';
export type { HeroMediaPreset } from '../media/hero-media';
