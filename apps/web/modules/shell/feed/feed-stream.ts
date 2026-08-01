import type { HousingPropertyRow } from '@/modules/habitacao/services/housing-client';

export type FeedMarkerTheme = {
  id: string;
  title: string;
  hint: string;
  badge?: string;
};

/** Rotating thematic markers — stream never “ends” at a section boundary. */
export const FEED_MARKER_THEMES: readonly FeedMarkerTheme[] = [
  {
    id: 'new',
    title: 'Patrimónios novos',
    hint: 'Acabaram de entrar na plataforma.',
  },
  {
    id: 'featured',
    title: 'Em destaque',
    hint: 'Selecção com presença premium.',
    badge: 'Destaque',
  },
  {
    id: 'nearby',
    title: 'Próximos de si',
    hint: 'Inventário relevante para explorar agora.',
  },
  {
    id: 'recommend',
    title: 'Recomendações',
    hint: 'Sugestões com base no inventário activo.',
  },
  {
    id: 'trends',
    title: 'Tendências',
    hint: 'O que a comunidade está a ver.',
  },
  {
    id: 'premium',
    title: 'Imóveis premium',
    hint: 'Património de gama alta.',
    badge: 'Premium',
  },
  {
    id: 'contracts',
    title: 'Actividade de contratos',
    hint: 'Formalização a avançar na plataforma.',
    badge: 'Contratos',
  },
  {
    id: 'news',
    title: 'Novidades',
    hint: 'Actualizações recentes do marketplace.',
  },
  {
    id: 'smart',
    title: 'Recomendações inteligentes',
    hint: 'Preparação para o motor KAI.',
    badge: 'KAI prep',
  },
  {
    id: 'more',
    title: 'Mais patrimónios',
    hint: 'Continue a explorar — o feed não acaba aqui.',
  },
  {
    id: 'sponsored',
    title: 'Anúncios patrocinados',
    hint: 'Campanhas e inventário em promoção.',
    badge: 'Patrocinado',
  },
] as const;

export type FeedStreamItem =
  | {
      kind: 'marker';
      key: string;
      theme: FeedMarkerTheme;
    }
  | {
      kind: 'listing';
      key: string;
      row: HousingPropertyRow;
      accent?: string;
    }
  | {
      kind: 'link-card';
      key: string;
      title: string;
      hint: string;
      href: string;
      cta: string;
    };

/**
 * Append a page of listings into a continuous stream with rotating markers.
 * Markers are inline — not separate page sections that “finish”.
 */
export function appendFeedPage(
  existing: FeedStreamItem[],
  rows: HousingPropertyRow[],
  pageIndex: number,
): FeedStreamItem[] {
  if (!rows.length) return existing;

  const next = [...existing];
  const theme = FEED_MARKER_THEMES[pageIndex % FEED_MARKER_THEMES.length]!;
  next.push({
    kind: 'marker',
    key: `marker-${theme.id}-p${pageIndex}`,
    theme,
  });

  rows.forEach((row, index) => {
    next.push({
      kind: 'listing',
      key: `listing-${row.id}-p${pageIndex}-${index}`,
      row,
      accent: theme.badge,
    });

    // Mid-page secondary cue keeps the stream feeling alive.
    if (index === 5 && rows.length > 7) {
      const mid = FEED_MARKER_THEMES[(pageIndex + 3) % FEED_MARKER_THEMES.length]!;
      next.push({
        kind: 'marker',
        key: `marker-${mid.id}-mid-p${pageIndex}`,
        theme: mid,
      });
    }
  });

  // Soft continuity card every other page.
  if (pageIndex % 2 === 1) {
    next.push({
      kind: 'link-card',
      key: `link-explore-p${pageIndex}`,
      title: 'Explorar habitação com filtros',
      hint: 'Afine localização, finalidade e tipologia sem sair da plataforma.',
      href: '/app/habitacao/explorar',
      cta: 'Abrir explorar',
    });
  }

  return next;
}
