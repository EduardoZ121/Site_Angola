'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  PARTNER_CATEGORY_LABELS,
  PARTNER_LIFECYCLE_STAGES,
  mapDbLifecycleToStage,
} from '@/modules/listings/lib/manual-ops-labels';

type PartnerProfile = {
  partner_category: string | null;
  ick_score: number | null;
  partner_lifecycle: string | null;
  kid: string | null;
};

/**
 * Ciclo de vida do Parceiro Patrimonial + classificação A–G + ICK (Manual Cap.2–3).
 */
export function PartnerLifecyclePanel() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user) return;
        const { data } = await client
          .from('profiles')
          .select('partner_category, ick_score, partner_lifecycle, kid')
          .eq('id', user.id)
          .maybeSingle();
        if (!cancelled) setProfile((data as PartnerProfile) ?? null);
      } catch {
        if (!cancelled) setProfile(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeStage = mapDbLifecycleToStage(profile?.partner_lifecycle);
  const activeIdx = PARTNER_LIFECYCLE_STAGES.findIndex((s) => s.key === activeStage);

  return (
    <section className="kuteka-glass flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Ciclo de vida do Parceiro Patrimonial
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Manual Cap.2–3 — quinze etapas, categorias A–G e Índice de Confiança Kuteka (ICK).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-kuteka border border-slate-200 bg-white px-3 py-1.5">
          KID: <span className="font-mono">{profile?.kid ?? 'Atribuído após verificação'}</span>
        </span>
        <span className="rounded-kuteka border border-slate-200 bg-white px-3 py-1.5">
          Categoria:{' '}
          {PARTNER_CATEGORY_LABELS[profile?.partner_category ?? ''] ??
            profile?.partner_category ??
            'Pendente'}
        </span>
        <span className="rounded-kuteka border border-brand-200 bg-brand-50 px-3 py-1.5 text-brand-950">
          ICK:{' '}
          {profile?.ick_score != null
            ? `${Number(profile.ick_score).toFixed(0)} / 100`
            : 'Em cálculo'}
        </span>
      </div>

      <ol className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {PARTNER_LIFECYCLE_STAGES.map((stage, idx) => {
          const done = activeIdx >= 0 && idx <= activeIdx;
          const current = idx === activeIdx;
          return (
            <li
              key={stage.key}
              className={
                current
                  ? 'rounded-kuteka border border-brand-500 bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-950'
                  : done
                    ? 'rounded-kuteka border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800'
                    : 'rounded-kuteka border border-dashed border-slate-200 px-2 py-1.5 text-xs text-slate-500'
              }
            >
              <span className="font-mono text-[0.65rem] text-slate-500">
                {String(idx + 1).padStart(2, '0')}
              </span>{' '}
              {stage.label}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
