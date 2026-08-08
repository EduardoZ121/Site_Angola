'use client';

import { useEffect, useState } from 'react';
import { Text } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  listUserActivity,
  type UserActivityRow,
} from '@/modules/administracao/services/governance-client';

const COPY = {
  pt: {
    title: 'Actividade recente',
    hint: 'Eventos da sua conta na plataforma Kuteka.',
    empty: 'Ainda não há actividade registada.',
    loadError: 'Não foi possível carregar a actividade. Tente novamente.',
  },
  en: {
    title: 'Recent activity',
    hint: 'Events from your account on the Kuteka platform.',
    empty: 'No activity recorded yet.',
    loadError: 'Could not load activity. Please try again.',
  },
  fr: {
    title: 'Activité récente',
    hint: 'Événements de votre compte sur la plateforme Kuteka.',
    empty: 'Aucune activité enregistrée pour le moment.',
    loadError: 'Impossible de charger l’activité. Réessayez.',
  },
  es: {
    title: 'Actividad reciente',
    hint: 'Eventos de su cuenta en la plataforma Kuteka.',
    empty: 'Aún no hay actividad registrada.',
    loadError: 'No se pudo cargar la actividad. Inténtelo de nuevo.',
  },
} as const;

function localeTag(locale: string): string {
  return locale === 'en' ? 'en-GB' : `${locale}-PT`;
}

type Props = {
  userId?: string;
  limit?: number;
};

export function UserActivityTimeline({ userId, limit = 20 }: Props) {
  const { locale } = useLocale();
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.pt;
  const [items, setItems] = useState<UserActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listUserActivity(userId, limit);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message || copy.loadError);
        setItems([]);
      } else {
        setError(null);
        setItems(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [copy.loadError, limit, userId]);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="user-activity-heading">
      <div className="flex flex-col gap-1">
        <h2 id="user-activity-heading" className="text-sm font-semibold text-slate-800">
          {copy.title}
        </h2>
        <Text className="text-sm text-slate-500">{copy.hint}</Text>
      </div>

      <SoftListSlot pending={loading && items.length === 0}>
        {error ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {error}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyState title={copy.title} description={copy.empty} />
        ) : null}

        {items.length > 0 ? (
          <ol className="relative flex flex-col gap-0 border-l border-slate-200 pl-4">
            {items.map((row) => (
              <li key={row.id} className="relative pb-4 last:pb-0">
                <span
                  className="absolute -left-[1.15rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400"
                  aria-hidden
                />
                <p className="font-medium text-slate-900">{row.title}</p>
                {row.summary ? (
                  <p className="mt-0.5 text-sm text-slate-600">{row.summary}</p>
                ) : null}
                <time className="mt-1 block text-xs text-slate-500" dateTime={row.occurred_at}>
                  {new Date(row.occurred_at).toLocaleString(localeTag(locale))}
                  {row.event_type ? ` · ${row.event_type}` : ''}
                </time>
              </li>
            ))}
          </ol>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
