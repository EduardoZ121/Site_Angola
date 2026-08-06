import type { LandingCopy } from './pt';

export const landingCopyEs: LandingCopy = {
  seo: {
    title: 'Kuteka — Patrimonio. Confianza. Vivienda.',
    description:
      'PropTech africana de patrimonio y confianza. Proteja, valorice y siga su patrimonio inmobiliario en Angola — con transparencia y profesionalismo.',
  },
  topbar: {
    brand: 'Kuteka',
    enter: 'Iniciar sesión',
    start: 'Empezar',
  },
  hero: {
    eyebrow: 'Kuteka · Angola',
    title: 'Patrimonio. Confianza. Vivienda.',
    subtitle:
      'La plataforma que protege, valoriza y sigue su patrimonio inmobiliario — con transparencia y profesionalismo.',
    primaryCta: 'Empezar',
    secondaryCta: 'Explorar',
    imageAlt: 'Ambiente residencial contemporáneo — una atmósfera de patrimonio y vivienda digna',
  },
  difference: {
    id: 'diferenca',
    title: 'Por qué Kuteka es diferente',
    intro: 'No somos un sitio de anuncios. Somos una plataforma de patrimonio y confianza.',
    pillars: [
      {
        id: 'trust',
        title: 'Confianza verificable',
        text: 'Identidades, documentos y procesos claros — para decidir con seguridad.',
      },
      {
        id: 'patrimony',
        title: 'Patrimonio, no solo inmuebles',
        text: 'Cada activo puede activarse, seguirse y valorizarse a lo largo del tiempo.',
      },
      {
        id: 'transparency',
        title: 'Transparencia total',
        text: 'Historial, estados y responsabilidades visibles para todas las partes.',
      },
    ],
  },
  howItWorks: {
    id: 'como-funciona',
    title: 'Cómo funciona',
    steps: [
      {
        n: '1',
        title: 'Descubrir',
        text: 'Encuentre oportunidades con información clara.',
      },
      {
        n: '2',
        title: 'Confiar',
        text: 'Verifique la puntuación, los documentos y el historial del patrimonio.',
      },
      {
        n: '3',
        title: 'Activar',
        text: 'Los clientes avanzan; los Socios Patrimoniales activan su patrimonio.',
      },
    ],
    cta: 'Empezar',
  },
  closing: {
    phrase: 'Construida para durar — con confianza, tecnología y excelencia operativa.',
    cta: 'Empezar',
  },
  footer: {
    brand: 'Kuteka',
    links: [
      { href: '/termos', label: 'Términos de uso' },
      { href: '/privacidade', label: 'Política de privacidad' },
      { href: '/cookies', label: 'Política de cookies' },
      { href: '/documentacao', label: 'Documentación' },
      { href: '/contacto', label: 'Contacto' },
    ],
    copyright: `© ${new Date().getFullYear()} Kuteka · Angola`,
  },
  routes: {
    start: '/auth/registar',
    enter: '/auth/entrar',
    exploreHash: '#diferenca',
  },
  skipToContent: 'Ir al contenido',
};
