export type HeroMediaPreset =
  'dashboard' | 'patrimonios' | 'habitacao' | 'agente' | 'confianca' | 'contratos' | 'admin';

export type HeroMediaSource = {
  image: string;
  imageMobile?: string;
  /** Optional lightweight loop; image always remains the fallback. */
  video?: string;
};

/**
 * Cinematic atmospheres — same visual language as the Landing hero.
 * Full-bleed second plane; never inset banner cards.
 * Copy (alt/eyebrow/title/subtitle) lives in shell content packs.
 */
export const HERO_MEDIA: Record<HeroMediaPreset, HeroMediaSource> = {
  dashboard: {
    /** Landing / cinematic. App shell uses `/images/hero-app.jpg` (AtmosphereBackground). */
    image: '/images/hero.jpg',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-white-luxury-home-exterior-and-pool-5061-large.mp4',
  },
  patrimonios: {
    image:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-modern-house-with-a-pool-5062-large.mp4',
  },
  habitacao: {
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-living-room-of-a-modern-luxury-house-4703-large.mp4',
  },
  agente: {
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
  },
  confianca: {
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
  },
  contratos: {
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
  },
  admin: {
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-modern-office-space-with-furniture-and-large-windows-4492-large.mp4',
  },
};

/** Resolve atmosphere preset from the authenticated pathname. */
export function presetFromPathname(pathname: string): HeroMediaPreset {
  if (pathname.startsWith('/app/patrimonios')) return 'patrimonios';
  if (pathname.startsWith('/app/habitacao')) return 'habitacao';
  if (pathname.startsWith('/app/agente')) return 'agente';
  if (pathname.startsWith('/app/confianca')) return 'confianca';
  if (pathname.startsWith('/app/centro-confianca')) return 'confianca';
  if (pathname.startsWith('/app/centro-seguranca')) return 'confianca';
  if (pathname.startsWith('/app/contratos')) return 'contratos';
  if (pathname.startsWith('/app/admin')) return 'admin';
  return 'dashboard';
}
