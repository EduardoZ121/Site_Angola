import type { HousingPropertyRow } from '../services/housing-client';

const RETIRED_KEY = 'kuteka-demo-pubs-retired';

/** As cinco publicações de demonstração já previstas no catálogo. Não são ofertas reais. */
export const DEMO_SHOWCASE: HousingPropertyRow[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111001',
    code: 'KTK-DEMO-0001',
    title: 'Moradia T4 Talatona',
    property_type: 'house',
    purpose: 'sale',
    province: 'Luanda',
    city: 'Talatona',
    address_line: 'Condomínio Belas Business Park',
    status: 'active',
    notes: 'Demonstração Kuteka. Não é uma oferta real.',
    price_aoa: 185000000,
    bedrooms: 4,
    cover_image_url: '/images/hero.jpg',
    is_demo: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a1111111-1111-4111-8111-111111111002',
    code: 'KTK-DEMO-0002',
    title: 'Apartamento T3 Kilamba',
    property_type: 'apartment',
    purpose: 'rent',
    province: 'Luanda',
    city: 'Kilamba',
    address_line: 'Centralidade do Kilamba',
    status: 'active',
    notes: 'Demonstração Kuteka. Não é uma oferta real.',
    price_aoa: 450000,
    bedrooms: 3,
    cover_image_url: '/images/hero.jpg',
    is_demo: true,
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'a1111111-1111-4111-8111-111111111003',
    code: 'KTK-DEMO-0003',
    title: 'Vivenda Benguela',
    property_type: 'house',
    purpose: 'sale',
    province: 'Benguela',
    city: 'Benguela',
    address_line: 'Zona residencial costeira',
    status: 'active',
    notes: 'Demonstração Kuteka. Não é uma oferta real.',
    price_aoa: 95000000,
    bedrooms: 5,
    cover_image_url: '/images/hero.jpg',
    is_demo: true,
    created_at: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'a1111111-1111-4111-8111-111111111004',
    code: 'KTK-DEMO-0004',
    title: 'Penthouse Luanda Sul',
    property_type: 'apartment',
    purpose: 'sale',
    province: 'Luanda',
    city: 'Luanda Sul',
    address_line: 'Torre residencial',
    status: 'active',
    notes: 'Demonstração Kuteka. Não é uma oferta real.',
    price_aoa: 320000000,
    bedrooms: 4,
    cover_image_url: '/images/hero.jpg',
    is_demo: true,
    created_at: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'a1111111-1111-4111-8111-111111111005',
    code: 'KTK-DEMO-0005',
    title: 'Fazenda Huambo',
    property_type: 'land',
    purpose: 'sale',
    province: 'Huambo',
    city: 'Huambo',
    address_line: 'Estrada para Caála',
    status: 'active',
    notes: 'Demonstração Kuteka. Não é uma oferta real.',
    price_aoa: 75000000,
    bedrooms: null,
    cover_image_url: '/images/hero.jpg',
    is_demo: true,
    created_at: '2026-01-05T00:00:00.000Z',
  },
];

export function showcaseById(id: string): HousingPropertyRow | null {
  return DEMO_SHOWCASE.find((row) => row.id === id) ?? null;
}

export function readRetiredDemoCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RETIRED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberRetiredDemo(code: string) {
  const next = [...new Set([...readRetiredDemoCodes(), code])];
  window.localStorage.setItem(RETIRED_KEY, JSON.stringify(next));
}

/** Completa o feed até cinco fichas quando a oferta real não chega. */
export function withDemoShowcase(
  real: HousingPropertyRow[],
  fromDatabase: HousingPropertyRow[],
  retired: string[],
): HousingPropertyRow[] {
  const hidden = new Set(retired);
  const seen = new Set(real.map((row) => row.code));
  const demos = (fromDatabase.length > 0 ? fromDatabase : DEMO_SHOWCASE).filter(
    (row) => row.is_demo && !hidden.has(row.code) && !seen.has(row.code),
  );
  const need = Math.max(0, 5 - real.length);
  return [...real, ...demos.slice(0, need)];
}
