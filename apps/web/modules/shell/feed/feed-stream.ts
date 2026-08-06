import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import type { HousingPropertyRow } from '@/modules/habitacao/services/housing-client';
import { getShellCopy } from '../content';

export type FeedMarkerTheme = {
  id: string;
  title: string;
  hint: string;
  badge?: string;
};

const MARKER_IDS = [
  'new',
  'featured',
  'nearby',
  'recommend',
  'trends',
  'premium',
  'contracts',
  'news',
  'smart',
  'more',
  'sponsored',
] as const;

/** Rotating thematic markers — stream never “ends” at a section boundary. */
export function getFeedMarkerThemes(
  locale?: AppLocale | string | null,
): readonly FeedMarkerTheme[] {
  const markers = getShellCopy(normalizeLocale(locale)).feed.markers as Record<
    string,
    { title: string; hint: string; badge?: string }
  >;
  return MARKER_IDS.map((id) => ({ id, ...markers[id]! }));
}

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
  locale?: AppLocale | string | null,
): FeedStreamItem[] {
  if (!rows.length) return existing;

  const themes = getFeedMarkerThemes(locale);
  const next = [...existing];
  const theme = themes[pageIndex % themes.length]!;
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
      const mid = themes[(pageIndex + 3) % themes.length]!;
      next.push({
        kind: 'marker',
        key: `marker-${mid.id}-mid-p${pageIndex}`,
        theme: mid,
      });
    }
  });

  // Soft continuity card every other page.
  if (pageIndex % 2 === 1) {
    const linkCard = getShellCopy(normalizeLocale(locale)).feed.linkCard;
    next.push({
      kind: 'link-card',
      key: `link-explore-p${pageIndex}`,
      title: linkCard.title,
      hint: linkCard.hint,
      href: '/app/habitacao/explorar',
      cta: linkCard.cta,
    });
  }

  return next;
}
