export type HeroMediaPreset =
  'dashboard' | 'patrimonios' | 'habitacao' | 'agente' | 'confianca' | 'contratos' | 'admin';

export type HeroMediaSource = {
  image: string;
  imageMobile?: string;
  /** Optional lightweight loop; image always remains the fallback. */
  video?: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

/**
 * Cinematic atmospheres — same visual language as the Landing hero.
 * Full-bleed second plane; never inset banner cards.
 */
export const HERO_MEDIA: Record<HeroMediaPreset, HeroMediaSource> = {
  dashboard: {
    /** Landing / cinematic. App shell uses `/images/hero-app.jpg` (AtmosphereBackground). */
    image: '/images/hero.jpg',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-white-luxury-home-exterior-and-pool-5061-large.mp4',
    alt: 'Moradia contemporânea ao entardecer',
    eyebrow: 'Kuteka · Angola',
    title: 'Plataforma imobiliária viva',
    subtitle: 'Património, habitação e confiança — a continuação natural da Landing.',
  },
  patrimonios: {
    image:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-modern-house-with-a-pool-5062-large.mp4',
    alt: 'Moradia contemporânea com arquitectura premium',
    eyebrow: 'Parceiro Patrimonial',
    title: 'Publique património com presença',
    subtitle: 'Fotografias, preço e galeria — o anúncio começa aqui.',
  },
  habitacao: {
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-living-room-of-a-modern-luxury-house-4703-large.mp4',
    alt: 'Interior residencial elegante',
    eyebrow: 'Cliente',
    title: 'Encontre habitação com transparência',
    subtitle: 'Explore, filtre e demonstre interesse no inventário activo.',
  },
  agente: {
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    alt: 'Mediação e trabalho de campo',
    eyebrow: 'Agente Certificado',
    title: 'Acompanhe no terreno',
    subtitle: 'Cobertura, visitas, interesses e pipeline num só lugar.',
  },
  confianca: {
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    alt: 'Documentação e verificação segura',
    eyebrow: 'Verificação',
    title: 'Relações seguras com evidência',
    subtitle: 'Checklist clara — Em análise, Aprovado ou Rejeitado.',
  },
  contratos: {
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    alt: 'Mesa executiva com contrato e assinatura',
    eyebrow: 'Contrato',
    title: 'Formalize com clareza',
    subtitle: 'Partes, valor, termos e aceitação antes de Pagamentos.',
  },
  admin: {
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    video:
      'https://assets.mixkit.co/videos/preview/mixkit-modern-office-space-with-furniture-and-large-windows-4492-large.mp4',
    alt: 'Ambiente executivo de operação',
    eyebrow: 'Operação',
    title: 'Comando da plataforma',
    subtitle: 'Contas, patrimónios, verificações e pedidos pendentes.',
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
