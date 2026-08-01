'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { REVIEW_SUBJECT_LABELS, type ContractReviewRow } from '../types';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="kuteka-detail-stars" aria-label={`${rating} de 5 estrelas`}>
      {'★★★★★'.slice(0, rating)}
      <span className="opacity-30">{'★★★★★'.slice(rating)}</span>
    </span>
  );
}

type EligibleContract = {
  id: string;
  code: string;
  status: string;
};

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { session, status: sessionStatus } = useAppSession();
  const canWrite =
    sessionStatus === 'ready' && !!session?.permissions.includes('reputation.manage');

  const [rows, setRows] = useState<ContractReviewRow[]>([]);
  const [contracts, setContracts] = useState<EligibleContract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [contractId, setContractId] = useState('');
  const [subjectKind, setSubjectKind] = useState('property');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

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
        if (!cancelled) setRows((data as ContractReviewRow[]) ?? []);

        if (canWrite) {
          const { data: userData } = await client.auth.getUser();
          const uid = userData.user?.id;
          if (uid) {
            const { data: contractsData } = await client
              .from('property_contracts')
              .select('id, code, status')
              .eq('property_id', propertyId)
              .eq('status', 'completed')
              .is('deleted_at', null)
              .or(`client_id.eq.${uid},partner_id.eq.${uid},agent_id.eq.${uid}`)
              .limit(12);
            if (!cancelled) {
              const list = (contractsData as EligibleContract[]) ?? [];
              setContracts(list);
              if (list[0]) setContractId(list[0].id);
            }
          }
        }
        if (!cancelled) setLoaded(true);
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
  }, [propertyId, canWrite]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    if (!contractId) {
      setFormError('Só pode avaliar após um contrato concluído associado a este imóvel.');
      return;
    }
    setSubmitting(true);
    try {
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        setFormError('Sessão inválida.');
        setSubmitting(false);
        return;
      }
      const { error } = await client.from('contract_reviews').insert({
        contract_id: contractId,
        property_id: propertyId,
        reviewer_id: user.id,
        subject_kind: subjectKind,
        rating,
        comment: comment.trim() || null,
        dimensions: {},
      });
      if (error) {
        setFormError(
          error.message.includes('duplicate') || error.code === '23505'
            ? 'Já avaliou este assunto neste contrato.'
            : 'Não foi possível guardar a avaliação. Verifique se o contrato está concluído.',
        );
      } else {
        setFormOk('Avaliação registada.');
        setComment('');
        const { data } = await client
          .from('contract_reviews')
          .select(
            'id, contract_id, property_id, reviewer_id, subject_kind, subject_user_id, rating, comment, dimensions, created_at',
          )
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(24);
        setRows((data as ContractReviewRow[]) ?? []);
      }
    } catch {
      setFormError('Não foi possível guardar a avaliação.');
    }
    setSubmitting(false);
  }

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

      {canWrite ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-3 border-t border-[var(--kuteka-detail-line)] pt-5"
        >
          <h3 className="kuteka-detail-subtitle">Escrever avaliação</h3>
          <p className="kuteka-detail-meta">
            Disponível apenas para partes de um contrato concluído neste património.
          </p>
          {contracts.length === 0 ? (
            <p className="kuteka-detail-body">
              Não tem contratos concluídos neste imóvel — as avaliações ficam disponíveis após a
              formalização.
            </p>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="kuteka-detail-label">Contrato</span>
                <select
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="kuteka-detail-label">Assunto</span>
                  <select
                    value={subjectKind}
                    onChange={(e) => setSubjectKind(e.target.value)}
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(REVIEW_SUBJECT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="kuteka-detail-label">Classificação</span>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} estrelas
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="kuteka-detail-label">Comentário</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Descreva a experiência…"
                />
              </label>
              {formError ? (
                <p className="text-sm text-amber-800" role="alert">
                  {formError}
                </p>
              ) : null}
              {formOk ? <p className="text-sm text-emerald-800">{formOk}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="kuteka-detail-chip kuteka-detail-chip--accent w-fit px-4 py-2"
              >
                {submitting ? 'A guardar…' : 'Publicar avaliação'}
              </button>
            </>
          )}
        </form>
      ) : null}

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
