import type { LandingCopy } from './pt';

export const landingCopyFr: LandingCopy = {
  seo: {
    title: 'Kuteka — Patrimoine. Confiance. Logement.',
    description:
      'PropTech africaine du patrimoine et de la confiance. Protégez, valorisez et suivez votre patrimoine immobilier en Angola — avec transparence et professionnalisme.',
  },
  topbar: {
    brand: 'Kuteka',
    enter: 'Se connecter',
    start: 'Commencer',
  },
  hero: {
    eyebrow: 'Kuteka · Angola',
    title: 'Patrimoine. Confiance. Logement.',
    subtitle:
      'La plateforme qui protège, valorise et suit votre patrimoine immobilier — avec transparence et professionnalisme.',
    primaryCta: 'Commencer',
    secondaryCta: 'Explorer',
    imageAlt:
      'Environnement résidentiel contemporain — une atmosphère de patrimoine et de logement digne',
  },
  difference: {
    id: 'diferenca',
    title: 'Pourquoi Kuteka est différent',
    intro:
      'Nous ne sommes pas un site de petites annonces. Nous sommes une plateforme du patrimoine et de la confiance.',
    pillars: [
      {
        id: 'trust',
        title: 'Confiance vérifiable',
        text: 'Identités, documents et processus clairs — pour décider en toute sécurité.',
      },
      {
        id: 'patrimony',
        title: 'Du patrimoine, pas seulement des biens',
        text: 'Chaque actif peut être activé, suivi et valorisé dans le temps.',
      },
      {
        id: 'transparency',
        title: 'Transparence totale',
        text: 'Historique, statuts et responsabilités visibles pour toutes les parties.',
      },
    ],
  },
  howItWorks: {
    id: 'como-funciona',
    title: 'Comment ça marche',
    steps: [
      {
        n: '1',
        title: 'Découvrir',
        text: 'Trouvez des opportunités avec une information claire.',
      },
      {
        n: '2',
        title: 'Faire confiance',
        text: "Vérifiez le score, les documents et l'historique du patrimoine.",
      },
      {
        n: '3',
        title: 'Activer',
        text: 'Les clients avancent ; les Partenaires Patrimoniaux activent leur patrimoine.',
      },
    ],
    cta: 'Commencer',
  },
  closing: {
    phrase: 'Construite pour durer — avec confiance, technologie et excellence opérationnelle.',
    cta: 'Commencer',
  },
  footer: {
    brand: 'Kuteka',
    links: [
      { href: '/termos', label: "Conditions d'utilisation" },
      { href: '/privacidade', label: 'Politique de confidentialité' },
      { href: '/contacto', label: 'Contact' },
    ],
    copyright: `© ${new Date().getFullYear()} Kuteka · Angola`,
  },
  routes: {
    start: '/auth/registar',
    enter: '/auth/entrar',
    exploreHash: '#diferenca',
  },
  skipToContent: 'Aller au contenu',
};
