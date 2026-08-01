'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { TimelineEvent } from '../types';

export function PropertyTimeline({ propertyId }: { propertyId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data } = await client
          .from('property_timeline_events')
          .select('id, property_id, event_type, title, summary, occurred_at')
          .eq('property_id', propertyId)
          .order('occurred_at', { ascending: true });
        if (!cancelled) {
          setEvents((data as TimelineEvent[]) ?? []);
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
      <section className="kuteka-detail-panel p-5" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="kuteka-detail-title">
          Histórico do imóvel
        </h2>
        <p className="kuteka-detail-body mt-2">
          A linha temporal cresce com interesses, visitas, propostas, contratos e avaliações.
        </p>
      </section>
    );
  }

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="kuteka-detail-title">
        Histórico do imóvel
      </h2>
      <p className="kuteka-detail-meta mt-1">Toda a vida deste património na Kuteka.</p>
      <ol className="kuteka-timeline mt-5">
        {events.map((event, index) => (
          <li key={event.id} className="kuteka-timeline__item">
            <span className="kuteka-timeline__dot" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="kuteka-detail-value">{event.title}</p>
                <time className="kuteka-detail-meta" dateTime={event.occurred_at}>
                  {new Date(event.occurred_at).toLocaleDateString('pt-AO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              {event.summary ? <p className="kuteka-detail-body mt-1">{event.summary}</p> : null}
              {index < events.length - 1 ? <span className="sr-only">depois</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
