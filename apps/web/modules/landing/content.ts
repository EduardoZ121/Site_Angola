/**
 * Landing content — kept as a re-export for backwards compatibility
 * (SEO metadata, tests). Locale-aware components should import
 * `getLandingCopy` from `./content` directly alongside `useLocale()`.
 */
export { getLandingCopy, landingCopyPt as landingContent } from './content/index';
export type { LandingCopy } from './content/index';
