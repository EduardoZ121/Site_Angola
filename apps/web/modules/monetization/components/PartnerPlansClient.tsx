'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  PARTNER_PLAN_OPTIONS,
  activatePartnerPlan,
  listPartnerPlans,
  type PartnerPlanRow,
} from '@/modules/monetization/services/monetization-client';

/**
 * Planos Parceiro Bronze / Silver / Gold — activação sandbox + renovação 30d.
 */
export function PartnerPlansClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canPartner =
    sessionStatus === 'ready' &&
    (!!session?.permissions.includes('properties.manage') ||
      !!session?.permissions.includes('finance.manage'));
  const denied = sessionStatus === 'ready' && !canPartner;
  const [subs, setSubs] = useState<PartnerPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canPartner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await listPartnerPlans();
    if (result.ok) setSubs(result.data);
    else setError(result.message);
    setLoading(false);
  }, [canPartner]);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
  }, [load, sessionStatus]);

  async function activate(code: string) {
    setBusy(code);
    setError(null);
    setMessage(null);
    const result = await activatePartnerPlan(code);
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`Plano activado (sandbox). Subscrição ${String(result.data.subscriptionId ?? '')}`);
    await load();
  }

  const activeCodes = new Set(
    subs.filter((s) => s.status === 'active' || s.status === 'trialing').map((s) => s.product_code),
  );

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Parceiro</p>
          <Heading level={1}>Planos Parceiro Kuteka</Heading>
          <Text className="mt-1 text-slate-700">
            Bronze, Silver e Gold — receita B2B recorrente. Pagamento sandbox até Multicaixa/EMIS.
          </Text>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/patrimonios" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Patrimónios
            </Link>
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Financeiro
            </Link>
          </div>
        </header>

        {denied ? (
          <ForbiddenPanel message="Planos Parceiro exigem papel de parceiro patrimonial ou Super Admin." />
        ) : null}

        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        {canPartner ? (
          <SoftListSlot pending={loading}>
            <section className="kuteka-detail-panel p-5">
              <h2 className="kuteka-detail-title">Escolher plano</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {PARTNER_PLAN_OPTIONS.map((plan) => (
                  <li
                    key={plan.code}
                    className="flex flex-col gap-3 rounded-kuteka border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{plan.blurb}</p>
                      <p className="mt-2 font-mono text-xs text-slate-500">{plan.code}</p>
                    </div>
                    {activeCodes.has(plan.code) ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Button
                        type="button"
                        loading={busy === plan.code}
                        onClick={() => void activate(plan.code)}
                      >
                        Activar (sandbox)
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="kuteka-detail-panel p-5">
              <h2 className="kuteka-detail-title">Subscrições</h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {subs.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{s.product_code}</p>
                      <p className="text-xs text-slate-500">
                        desde {new Date(s.started_at).toLocaleDateString('pt-PT')}
                        {s.renews_at
                          ? ` · renova ${new Date(s.renews_at).toLocaleDateString('pt-PT')}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant={s.status === 'active' ? 'success' : 'warning'}>
                      {s.status}
                    </Badge>
                  </li>
                ))}
                {subs.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">Nenhum plano activo ainda.</li>
                ) : null}
              </ul>
            </section>
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
