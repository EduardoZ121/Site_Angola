'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { TimelineEvent } from '../types';

type TimelineRow = TimelineEvent & {
  actor_id?: string | null;
  actor_name?: string | null;
};

const TYPE_HINT: Record<string, string> = {
  registered: 'Registo',
  documents: 'Documentação',
  inspection: 'Inspeção',
  evaluation: 'Avaliação',
  renovation: 'Remodelação',
  service_contract: 'Contrato Kuteka',
  published: 'Publicação',
  interest: 'Interesse',
  visit: 'Visita',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  contract: 'Contrato',
  payment: 'Pagamento',
  review: 'Avaliação',
  completed: 'Conclusão',
  renewal: 'Renovação',
};

/**
 * Linha temporal completa do imóvel — data, responsável e descrição.
 */
export function PropertyTimeline({ propertyId }: { propertyId: string }) {
  const [events, setEvents] = useState<TimelineRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data } = await client
          .from('property_timeline_events')
          .select('id, property_id, event_type, title, summary, occurred_at, actor_id')
          .eq('property_id', propertyId)
          .order('occurred_at', { ascending: true });

        const rows = (data as TimelineRow[]) ?? [];
        const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
        const names: Record<string, string> = {};
        if (actorIds.length) {
          const { data: profiles } = await client
            .from('profiles')
            .select('id, display_name')
            .in('id', actorIds);
          for (const p of profiles ?? []) {
            names[(p as { id: string; display_name: string | null }).id] =
              (p as { display_name: string | null }).display_name || 'Utilizador Kuteka';
          }
        }

        if (!cancelled) {
          setEvents(
            rows.map((r) => ({
              ...r,
              actor_name: r.actor_id ? (names[r.actor_id] ?? 'Equipa Kuteka') : 'Sistema Kuteka',
            })),
          );
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!loaded) {
    return (
      <section className="kuteka-detail-panel min-h-[8rem] p-5" aria-busy="true">
        <h2 className="kuteka-detail-title">Histórico do imóvel</h2>
        <p className="kuteka-detail-meta mt-2">A carregar linha temporal…</p>
      </section>
    );
  }

  if (!events.length) {
    return (
      <section
        id="historico"
        className="kuteka-detail-panel p-5"
        aria-labelledby="timeline-heading"
      >
        <h2 id="timeline-heading" className="kuteka-detail-title">
          Histórico do imóvel
        </h2>
        <p className="kuteka-detail-body mt-2">
          A linha temporal regista registo, documentação, inspeção, avaliação, publicação, visitas,
          propostas, contratos e renovações.
        </p>
      </section>
    );
  }

  return (
    <section
      id="historico"
      className="kuteka-detail-panel p-5 sm:p-6"
      aria-labelledby="timeline-heading"
    >
      <h2 id="timeline-heading" className="kuteka-detail-title">
        Histórico do imóvel
      </h2>
      <p className="kuteka-detail-meta mt-1">
        Linha temporal completa — cada evento com data, responsável e descrição.
      </p>
      <ol className="kuteka-timeline mt-5">
        {events.map((event) => (
          <li key={event.id} className="kuteka-timeline__item">
            <span className="kuteka-timeline__dot" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="kuteka-detail-value">{event.title}</p>
                <span className="kuteka-detail-chip text-[0.65rem]">
                  {TYPE_HINT[event.event_type] ?? event.event_type}
                </span>
                <time className="kuteka-detail-meta" dateTime={event.occurred_at}>
                  {new Date(event.occurred_at).toLocaleDateString('pt-AO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <p className="kuteka-detail-meta mt-1">Responsável: {event.actor_name}</p>
              {event.summary ? <p className="kuteka-detail-body mt-1">{event.summary}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
