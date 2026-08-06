'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getOpsCopy } from '../content';
import { formatAoa, formatDays, getExitReasons, getMaintenanceCategories } from '../format';
import { loadOpsStats } from '../load-ops-stats';
import type { OpsContract, OpsStats } from '../types';

/**
 * Cliente residente — contrato, pagamentos, manutenção e intenção de saída.
 */
export function ResidentOpsClient() {
  const { locale } = useLocale();
  const copy = getOpsCopy(locale).resident;
  const exitReasons = getExitReasons(locale);
  const maintenanceCategories = getMaintenanceCategories(locale);
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [exitDays, setExitDays] = useState('60');
  const [exitReason, setExitReason] = useState('mudanca_cidade');
  const [maintCategory, setMaintCategory] = useState('maintenance');
  const [maintTitle, setMaintTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }
    const data = await loadOpsStats(user.id);
    setStats(data);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const active: OpsContract | undefined = stats?.clientContracts.find((c) => c.status === 'active');

  async function submitExitIntent() {
    if (!active) return;
    setBusy(true);
    setMessage(null);
    try {
      const client = createBrowserClient();
      const days = exitDays === 'custom' ? 45 : Number(exitDays);
      const date = new Date();
      date.setDate(date.getDate() + (Number.isFinite(days) ? days : 45));
      const exit_intent_date = date.toISOString().slice(0, 10);
      const { error } = await client.rpc('set_contract_exit_intent', {
        p_contract_id: active.id,
        p_exit_intent: 'confirmed',
        p_exit_intent_date: exit_intent_date,
        p_exit_reason: exitReason,
        p_exit_notes: copy.exitNoteTemplate.replace('{days}', String(days)),
      });
      if (error) throw error;
      setMessage(copy.exitSuccess);
      await refresh();
    } catch {
      setMessage(copy.exitError);
    } finally {
      setBusy(false);
    }
  }

  async function submitMaintenance() {
    if (!active || !maintTitle.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error('auth');
      const { data: contract } = await client
        .from('property_contracts')
        .select('property_id, partner_id')
        .eq('id', active.id)
        .maybeSingle();
      const { error } = await client.from('maintenance_requests').insert({
        property_id: contract?.property_id ?? active.propertyId,
        contract_id: active.id,
        client_id: user.id,
        partner_id: contract?.partner_id ?? null,
        category: maintCategory,
        title: maintTitle.trim(),
        description: copy.maintenanceNoteDefault,
        status: 'requested',
        created_by: user.id,
        updated_by: user.id,
      });
      if (error) throw error;
      setMaintTitle('');
      setMessage(copy.maintenanceSuccess);
      await refresh();
    } catch {
      setMessage(copy.maintenanceError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
        <Heading level={1}>{copy.title}</Heading>
        <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
      </header>

      {message ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {message}
        </div>
      ) : null}

      {loading ? <p className="kuteka-detail-meta">{copy.loading}</p> : null}

      {!loading && !active ? (
        <section className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-body">{copy.noContractBody}</p>
          <Link
            href="/app/habitacao/explorar"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3 w-fit')}
          >
            {copy.exploreHousing}
          </Link>
        </section>
      ) : null}

      {active ? (
        <>
          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.contractTitle}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: copy.statusLabel, value: active.status },
                { label: copy.startLabel, value: active.startsOn ?? '—' },
                { label: copy.endLabel, value: active.endsOn ?? '—' },
                {
                  label: copy.daysRemainingLabel,
                  value: formatDays(active.daysRemaining, locale),
                },
                {
                  label: copy.rentLabel,
                  value: formatAoa(active.nextPaymentAmountAoa ?? active.amountAoa / 12),
                },
                { label: copy.depositLabel, value: formatAoa(active.depositAoa) },
                { label: copy.nextPaymentLabel, value: active.nextPaymentDue ?? '—' },
                {
                  label: copy.daysUntilPaymentLabel,
                  value: formatDays(active.daysUntilPayment, locale),
                },
              ].map((item) => (
                <li key={item.label} className="kuteka-role-stat">
                  <p className="kuteka-role-stat__value">{item.value}</p>
                  <p className="kuteka-role-stat__label">{item.label}</p>
                </li>
              ))}
            </ul>
            <p className="kuteka-detail-meta mt-3">
              {active.propertyTitle} · {active.propertyCode} · {copy.paymentsLabel}:{' '}
              {stats?.paymentsPaid ?? 0} {copy.paymentsPaidLabel} · {stats?.paymentsPending ?? 0}{' '}
              {copy.paymentsPendingLabel} · {stats?.paymentsLate ?? 0} {copy.paymentsLateLabel}
            </p>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.serviceTitle}</h2>
            <p className="kuteka-detail-body mt-1">{copy.serviceSubtitle}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                className="kuteka-ops-input"
                value={maintCategory}
                onChange={(e) => setMaintCategory(e.target.value)}
              >
                {maintenanceCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="kuteka-ops-input flex-1"
                placeholder={copy.servicePlaceholder}
                value={maintTitle}
                onChange={(e) => setMaintTitle(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !maintTitle.trim()}
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                onClick={() => void submitMaintenance()}
              >
                {copy.send}
              </button>
            </div>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.exitTitle}</h2>
            <p className="kuteka-detail-body mt-1">{copy.exitSubtitle}</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <select
                className="kuteka-ops-input"
                value={exitDays}
                onChange={(e) => setExitDays(e.target.value)}
              >
                <option value="30">{copy.exit30}</option>
                <option value="60">{copy.exit60}</option>
                <option value="90">{copy.exit90}</option>
                <option value="custom">{copy.exitCustom}</option>
              </select>
              <select
                className="kuteka-ops-input"
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
              >
                {exitReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                onClick={() => void submitExitIntent()}
              >
                {copy.registerExit}
              </button>
            </div>
            {active.exitIntent !== 'none' ? (
              <p className="kuteka-detail-meta mt-3">
                {copy.currentStateLabel}: {active.exitIntent}
                {active.exitIntentDate ? ` · ${active.exitIntentDate}` : ''}
                {active.exitReason ? ` · ${active.exitReason}` : ''}
              </p>
            ) : null}
            <Link
              href="/app/mudanca"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4 w-fit')}
            >
              {copy.activateSmartMove}
            </Link>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.providersTitle}</h2>
            <p className="kuteka-detail-body mt-1">{copy.providersSubtitle}</p>
            <Link
              href="/app/servicos"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 w-fit')}
            >
              {copy.openMarketplace}
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
