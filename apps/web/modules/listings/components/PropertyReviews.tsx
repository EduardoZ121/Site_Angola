'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { REVIEW_SUBJECT_LABELS, type ContractReviewRow } from '../types';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="kuteka-detail-stars" aria-label={`${rating} de 5 estrelas`}>
      {'★★★★★'.slice(0, rating)}
      <span className="opacity-30">{'★★★★★'.slice(rating)}</span>
    </span>
  );
}

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<ContractReviewRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data } = await client
          .from('contract_reviews')
          .select(
            'id, contract_id, property_id, reviewer_id, subject_kind, subject_user_id, rating, comment, dimensions, created_at',
          )
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(24);
        if (!cancelled) {
          setRows((data as ContractReviewRow[]) ?? []);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const avg =
    rows.length > 0 ? rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length : null;

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="kuteka-detail-title">
            Reputação & avaliações
          </h2>
          <p className="kuteka-detail-meta mt-1">
            Após conclusão do contrato — imóvel, proprietário, agente e experiência.
          </p>
        </div>
        {avg != null ? (
          <div className="text-right">
            <Stars rating={Math.round(avg)} />
            <p className="kuteka-detail-meta mt-1">
              {avg.toFixed(1)} · {rows.length} avaliação(ões)
            </p>
          </div>
        ) : null}
      </div>

      {!loaded ? <p className="kuteka-detail-meta mt-4">A carregar avaliações…</p> : null}

      {loaded && rows.length === 0 ? (
        <p className="kuteka-detail-body mt-4">
          Ainda não há avaliações públicas. Elas aparecem quando um contrato é concluído e as partes
          partilham feedback — como no Airbnb.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="kuteka-detail-review">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                  {REVIEW_SUBJECT_LABELS[row.subject_kind] ?? row.subject_kind}
                </span>
                <Stars rating={Number(row.rating)} />
              </div>
              {row.comment ? <p className="kuteka-detail-body mt-2">{row.comment}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
