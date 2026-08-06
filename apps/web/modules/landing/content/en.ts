import type { LandingCopy } from './pt';

export const landingCopyEn: LandingCopy = {
  seo: {
    title: 'Kuteka — Legacy. Trust. Housing.',
    description:
      'African property-tech built on legacy and trust. Protect, grow and track your real estate assets in Angola — with transparency and professionalism.',
  },
  topbar: {
    brand: 'Kuteka',
    enter: 'Sign in',
    start: 'Get started',
  },
  hero: {
    eyebrow: 'Kuteka · Angola',
    title: 'Legacy. Trust. Housing.',
    subtitle:
      'The platform that protects, grows and tracks your real estate assets — with transparency and professionalism.',
    primaryCta: 'Get started',
    secondaryCta: 'Explore',
    imageAlt:
      'Contemporary residential environment — an atmosphere of legacy and dignified housing',
  },
  difference: {
    id: 'diferenca',
    title: 'Why Kuteka is different',
    intro: "We're not a listings site. We're a platform built on legacy and trust.",
    pillars: [
      {
        id: 'trust',
        title: 'Verifiable trust',
        text: 'Identities, documents and clear processes — so you can decide with confidence.',
      },
      {
        id: 'patrimony',
        title: 'Legacy, not just properties',
        text: 'Every asset can be activated, tracked and grown in value over time.',
      },
      {
        id: 'transparency',
        title: 'Full transparency',
        text: 'History, statuses and responsibilities visible to every party.',
      },
    ],
  },
  howItWorks: {
    id: 'como-funciona',
    title: 'How it works',
    steps: [
      {
        n: '1',
        title: 'Discover',
        text: 'Find opportunities with clear information.',
      },
      {
        n: '2',
        title: 'Trust',
        text: 'Check the score, documents and history of the asset.',
      },
      {
        n: '3',
        title: 'Activate',
        text: 'Clients move forward; Property Partners activate their assets.',
      },
    ],
    cta: 'Get started',
  },
  closing: {
    phrase: 'Built to last — with trust, technology and operational excellence.',
    cta: 'Get started',
  },
  footer: {
    brand: 'Kuteka',
    links: [
      { href: '/termos', label: 'Terms of use' },
      { href: '/privacidade', label: 'Privacy policy' },
      { href: '/contacto', label: 'Contact' },
    ],
    copyright: `© ${new Date().getFullYear()} Kuteka · Angola`,
  },
  routes: {
    start: '/auth/registar',
    enter: '/auth/entrar',
    exploreHash: '#diferenca',
  },
  skipToContent: 'Skip to content',
};
