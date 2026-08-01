'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PropertyCard } from '@/modules/habitacao/components/PropertyCard';
import {
  exploreActiveProperties,
  type HousingPropertyRow,
} from '@/modules/habitacao/services/housing-client';
import { SoftListSlot } from './SoftListSlot';

type FeedSection = {
  id: string;
  title: string;
  hint: string;
  badge?: string;
  rows: HousingPropertyRow[];
};

function shuffleStable(rows: HousingPropertyRow[], salt: number): HousingPropertyRow[] {
  return [...rows].sort((a, b) => {
    const ha = (a.id.charCodeAt(8) + salt) % 97;
    const hb = (b.id.charCodeAt(8) + salt) % 97;
    return ha - hb;
  });
}

function byNewest(rows: HousingPropertyRow[]): HousingPropertyRow[] {
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function byPriceDesc(rows: HousingPropertyRow[]): HousingPropertyRow[] {
  return [...rows].sort((a, b) => (b.price_aoa ?? 0) - (a.price_aoa ?? 0));
}

function FeedRail({ section }: { section: FeedSection }) {
  if (!section.rows.length) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`feed-${section.id}`}>
      <div className="kuteka-glass flex flex-wrap items-end justify-between gap-2 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`feed-${section.id}`} className="text-base font-semibold text-slate-900">
              {section.title}
            </h2>
            {section.badge ? <Badge variant="brand">{section.badge}</Badge> : null}
          </div>
          <Text className="mt-1 text-sm text-slate-600">{section.hint}</Text>
        </div>
        <Link
          href="/app/habitacao/explorar"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
        >
          Ver tudo
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.rows.slice(0, 6).map((row) => (
          <li key={`${section.id}-${row.id}`}>
            <PropertyCard row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Continuous activity feed for /app — no enter animations, no pulse skeletons.
 */
export function PlatformFeed({ canExplore }: { canExplore: boolean }) {
  const [rows, setRows] = useState<HousingPropertyRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canExplore) {
        setRows([]);
        setHydrated(true);
        return;
      }
      const result = await exploreActiveProperties({});
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setHydrated(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [canExplore]);

  const sections = useMemo((): FeedSection[] => {
    if (!rows.length) return [];
    const newest = byNewest(rows);
    const premium = byPriceDesc(rows).filter((r) => (r.price_aoa ?? 0) >= 50_000_000);
    const luanda = rows.filter((r) => (r.province || '').toLowerCase().includes('luanda'));
    const rent = rows.filter((r) => r.purpose === 'rent' || r.purpose === 'both');
    const popular = shuffleStable(rows, 11);
    const sponsored = shuffleStable(
      rows.filter((r) => r.is_demo),
      3,
    );

    return [
      {
        id: 'recent',
        title: 'Publicados recentemente',
        hint: 'Novos anúncios a entrar na plataforma.',
        rows: newest,
      },
      {
        id: 'featured',
        title: 'Em destaque',
        hint: 'Patrimónios premium seleccionados para si.',
        badge: 'Destaque',
        rows: premium.length ? premium : newest,
      },
      {
        id: 'nearby',
        title: 'Próximos de si',
        hint: 'Inventário em Luanda e arredores.',
        rows: luanda.length ? luanda : newest,
      },
      {
        id: 'rent',
        title: 'Recomendações para arrendar',
        hint: 'Opções activas de arrendamento.',
        rows: rent.length ? rent : newest,
      },
      {
        id: 'popular',
        title: 'Populares esta semana',
        hint: 'Anúncios com maior interesse na comunidade.',
        rows: popular,
      },
      {
        id: 'sponsored',
        title: 'Novidades & patrocinados',
        hint: 'Campanhas e inventário demo para explorar a Kuteka.',
        badge: 'Patrocinado',
        rows: sponsored.length ? sponsored : newest,
      },
      {
        id: 'smart',
        title: 'Recomendações inteligentes',
        hint: 'Sugestões com base no inventário activo da plataforma.',
        badge: 'KAI prep',
        rows: shuffleStable(rows, 29),
      },
    ];
  }, [rows]);

  if (!canExplore) {
    return (
      <div className="kuteka-glass p-5">
        <p className="font-medium text-slate-900">Active o papel Cliente para ver o feed</p>
        <Text className="mt-1 text-sm text-slate-600">
          O feed mostra patrimónios, destaques e recomendações assim que tiver acesso a Habitação.
        </Text>
        <Link
          href="/auth/onboarding/papeis"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4 inline-flex')}
        >
          Activar papel
        </Link>
      </div>
    );
  }

  return (
    <SoftListSlot pending={!hydrated} minHeightClassName="min-h-[28rem]">
      {error ? (
        <div
          role="alert"
          className="kuteka-glass border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950"
        >
          {error}
        </div>
      ) : null}

      {!error && hydrated && !sections.length ? (
        <div className="kuteka-glass p-5">
          <p className="font-medium text-slate-900">Feed a aquecer</p>
          <Text className="mt-1 text-sm text-slate-600">
            Ainda não há anúncios activos. Explore Habitação ou publique o primeiro património.
          </Text>
        </div>
      ) : null}

      {sections.length ? (
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <FeedRail key={section.id} section={section} />
          ))}
        </div>
      ) : null}
    </SoftListSlot>
  );
}
