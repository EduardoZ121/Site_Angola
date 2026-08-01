export type HeroMediaPreset =
  'dashboard' | 'patrimonios' | 'habitacao' | 'agente' | 'confianca' | 'admin';

export type HeroMediaSource = {
  image: string;
  imageMobile?: string;
  video?: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

/**
 * Curated premium media for module atmospheres.
 * Videos are optional lightweight loops; image is always the fallback.
 */
export const HERO_MEDIA: Record<HeroMediaPreset, HeroMediaSource> = {
  dashboard: {
    image:
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=1800&q=80',
    imageMobile: '/images/hero-mobile.jpg',
    alt: 'Vista aérea sobre a cidade ao entardecer',
    eyebrow: 'Kuteka',
    title: 'O seu espaço operacional',
    subtitle: 'Património, habitação e confiança num único fluxo profissional.',
  },
  patrimonios: {
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80',
    alt: 'Arquitectura residencial contemporânea',
    eyebrow: 'Parceiro Patrimonial',
    title: 'Active e apresente o seu património',
    subtitle: 'Fotografias, preço e galeria — o anúncio começa aqui.',
  },
  habitacao: {
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=80',
    alt: 'Família a visitar um bairro residencial moderno',
    eyebrow: 'Cliente',
    title: 'Encontre habitação com transparência',
    subtitle: 'Explore inventário activo, filtre e demonstre interesse.',
  },
  agente: {
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=70',
    alt: 'Mediação e visitas no terreno',
    eyebrow: 'Agente Certificado',
    title: 'Acompanhe no terreno com método',
    subtitle: 'Cobertura, acompanhamentos e pipeline de interesses.',
  },
  confianca: {
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80',
    alt: 'Documentação e verificação segura',
    eyebrow: 'Verificação',
    title: 'Relações seguras com evidência',
    subtitle: 'Checklist, estados claros e revisão responsável.',
  },
  admin: {
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80',
    alt: 'Ambiente executivo de operação',
    eyebrow: 'Operação',
    title: 'Comando da plataforma',
    subtitle: 'Contas, patrimónios, verificações e pedidos pendentes.',
  },
};
