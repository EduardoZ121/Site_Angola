import { describe, expect, it } from 'vitest';
import type { HousingPropertyRow } from '@/modules/habitacao/services/housing-client';
import { appendFeedPage, getFeedMarkerThemes } from './feed-stream';

const FEED_MARKER_THEMES = getFeedMarkerThemes('pt');

function row(id: string): HousingPropertyRow {
  return {
    id,
    code: `P-${id}`,
    title: `Title ${id}`,
    property_type: 'apartment',
    purpose: 'sale',
    province: 'Luanda',
    city: 'Luanda',
    address_line: null,
    status: 'active',
    notes: null,
    price_aoa: 1_000_000,
    bedrooms: 2,
    cover_image_url: null,
    is_demo: true,
    created_at: '2026-08-01T00:00:00Z',
  };
}

describe('appendFeedPage', () => {
  it('starts each page with a rotating marker and keeps a continuous stream', () => {
    const page0 = appendFeedPage([], [row('a'), row('b')], 0);
    expect(page0[0]).toMatchObject({
      kind: 'marker',
      theme: FEED_MARKER_THEMES[0],
    });
    expect(page0.filter((i) => i.kind === 'listing')).toHaveLength(2);

    const page1 = appendFeedPage(page0, [row('c')], 1);
    expect(page1.length).toBeGreaterThan(page0.length);
    const markers = page1.filter((i) => i.kind === 'marker');
    expect(
      markers.some((m) => m.kind === 'marker' && m.theme.id === FEED_MARKER_THEMES[1]!.id),
    ).toBe(true);
  });
});
