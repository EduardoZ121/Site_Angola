export type LandingDifferencePillarId = 'trust' | 'patrimony' | 'transparency';

export type LandingCopy = {
  seo: {
    title: string;
    description: string;
  };
  topbar: {
    brand: string;
    enter: string;
    start: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
  };
  difference: {
    id: string;
    title: string;
    intro: string;
    pillars: {
      id: LandingDifferencePillarId;
      title: string;
      text: string;
    }[];
  };
  howItWorks: {
    id: string;
    title: string;
    steps: {
      n: string;
      title: string;
      text: string;
    }[];
    cta: string;
  };
  closing: {
    phrase: string;
    cta: string;
  };
  footer: {
    brand: string;
    links: { href: string; label: string }[];
    copyright: string;
  };
  routes: {
    start: string;
    enter: string;
    exploreHash: string;
  };
  skipToContent: string;
};

/**
 * Landing content — separated from structure (PASSO 1A §16.1).
 * Official copy from PASSO 1 + PASSO 1A.
 */
export const landingCopyPt: LandingCopy = {
  seo: {
    title: 'Kuteka — Património. Confiança. Habitação.',
    description:
      'PropTech africana de património e confiança. Proteja, valorize e acompanhe o seu património imobiliário em Angola — com transparência e profissionalismo.',
  },
  topbar: {
    brand: 'Kuteka',
    enter: 'Entrar',
    start: 'Começar',
  },
  hero: {
    eyebrow: 'Kuteka · Angola',
    title: 'Património. Confiança. Habitação.',
    subtitle:
      'A plataforma que protege, valoriza e acompanha o seu património imobiliário — com transparência e profissionalismo.',
    primaryCta: 'Começar',
    secondaryCta: 'Explorar',
    imageAlt: 'Ambiente residencial contemporâneo — atmosfera de património e habitação digna',
  },
  difference: {
    id: 'diferenca',
    title: 'Porque a Kuteka é diferente',
    intro: 'Não somos um site de anúncios. Somos uma plataforma de património e confiança.',
    pillars: [
      {
        id: 'trust',
        title: 'Confiança verificável',
        text: 'Identidades, documentos e processos claros — para decidir com segurança.',
      },
      {
        id: 'patrimony',
        title: 'Património, não só imóveis',
        text: 'Cada activo pode ser activado, acompanhado e valorizado ao longo do tempo.',
      },
      {
        id: 'transparency',
        title: 'Transparência total',
        text: 'Histórico, estados e responsabilidades visíveis para todas as partes.',
      },
    ],
  },
  howItWorks: {
    id: 'como-funciona',
    title: 'Como funciona',
    steps: [
      {
        n: '1',
        title: 'Descobrir',
        text: 'Encontre oportunidades com informação clara.',
      },
      {
        n: '2',
        title: 'Confiar',
        text: 'Verifique score, documentos e histórico do património.',
      },
      {
        n: '3',
        title: 'Activar',
        text: 'Clientes avançam; Parceiros Patrimoniais activam o seu património.',
      },
    ],
    cta: 'Começar',
  },
  closing: {
    phrase: 'Construída para durar — com confiança, tecnologia e excelência operacional.',
    cta: 'Começar',
  },
  footer: {
    brand: 'Kuteka',
    links: [
      { href: '/termos', label: 'Termos de utilização' },
      { href: '/privacidade', label: 'Política de privacidade' },
      { href: '/contacto', label: 'Contacto' },
    ],
    copyright: `© ${new Date().getFullYear()} Kuteka · Angola`,
  },
  routes: {
    start: '/auth/registar',
    enter: '/auth/entrar',
    exploreHash: '#diferenca',
  },
  skipToContent: 'Ir para o conteúdo',
};
