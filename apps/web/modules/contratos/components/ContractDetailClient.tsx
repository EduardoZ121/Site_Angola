'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { IdentityPartySnapshot } from '@kuteka/types';
import { Badge, Button, Heading, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getPartySnapshot } from '@/modules/identidade/services/identity-client';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getContratosCopy } from '../content';
import {
  acceptPropertyContract,
  cancelPropertyContract,
  completePropertyContract,
  getContract,
  getContractProperty,
  type ContractRow,
} from '../services/contracts-client';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'brand' {
  if (status === 'active' || status === 'completed') return 'success';
  if (status === 'pending_acceptance' || status === 'draft') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'default';
}

function PartyBlock({
  label,
  userId,
  snapshot,
}: {
  label: string;
  userId: string | null;
  snapshot: IdentityPartySnapshot | null;
}) {
  if (!userId) {
    return (
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-500">—</dd>
      </div>
    );
  }
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">
        <p className="font-medium">
          {snapshot?.legalFullName || snapshot?.preferredName || snapshot?.displayName || '—'}
        </p>
        {snapshot?.document?.number ? (
          <p className="mt-0.5 text-xs text-slate-600">
            {String(snapshot.document.kind).toUpperCase()} {snapshot.document.number}
          </p>
        ) : null}
        {snapshot?.address?.line ? (
          <p className="mt-0.5 text-xs text-slate-600">{snapshot.address.line}</p>
        ) : null}
        {snapshot?.phonePrimary ? (
          <p className="mt-0.5 text-xs text-slate-600">{snapshot.phonePrimary}</p>
        ) : null}
        {snapshot?.email ? <p className="mt-0.5 text-xs text-slate-600">{snapshot.email}</p> : null}
        <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{userId}</p>
        {snapshot ? (
          <Badge variant={snapshot.kycLevel >= 2 ? 'success' : 'warning'} className="mt-1">
            KYC {snapshot.kycLevel} · Índice {Number(snapshot.trustIndex).toFixed(0)}
          </Badge>
        ) : null}
      </dd>
    </div>
  );
}

function PartySnapshots({
  clientId,
  partnerId,
  agentId,
  labels,
}: {
  clientId: string;
  partnerId: string;
  agentId: string | null;
  labels: { client: string; partner: string; agent: string };
}) {
  const [client, setClient] = useState<IdentityPartySnapshot | null>(null);
  const [partner, setPartner] = useState<IdentityPartySnapshot | null>(null);
  const [agent, setAgent] = useState<IdentityPartySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [c, p, a] = await Promise.all([
        getPartySnapshot(clientId),
        getPartySnapshot(partnerId),
        agentId ? getPartySnapshot(agentId) : Promise.resolve({ ok: false as const, message: '' }),
      ]);
      if (cancelled) return;
      setClient(c.ok ? c.data : null);
      setPartner(p.ok ? p.data : null);
      setAgent(a.ok ? a.data : null);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [agentId, clientId, partnerId]);

  return (
    <dl className="mt-4 flex flex-col gap-4">
      <PartyBlock label={labels.client} userId={clientId} snapshot={client} />
      <PartyBlock label={labels.partner} userId={partnerId} snapshot={partner} />
      <PartyBlock label={labels.agent} userId={agentId} snapshot={agent} />
    </dl>
  );
}

export function ContractDetailClient({ id }: { id: string }) {
  const { locale } = useLocale();
  const copy = getContratosCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage =
    sessionStatus === 'ready' && !!session?.permissions.includes('contracts.manage');
  const isAdmin = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canManage;

  const [row, setRow] = useState<ContractRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'accept' | 'cancel' | 'complete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [contractResult, userResult] = await Promise.all([
      getContract(id),
      createBrowserClient().auth.getUser(),
    ]);
    if (!contractResult.ok) {
      setError(contractResult.message);
      setRow(null);
    } else {
      setError(null);
      setRow(contractResult.data);
    }
    setUserId(userResult.data.user?.id ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready' && canManage) void load();
  }, [canManage, load, sessionStatus]);

  async function runTransition(kind: 'accept' | 'cancel' | 'complete') {
    setBusy(kind);
    setError(null);
    setMessage(null);
    const result =
      kind === 'accept'
        ? await acceptPropertyContract({ contractId: id })
        : kind === 'cancel'
          ? await cancelPropertyContract({ contractId: id })
          : await completePropertyContract({ contractId: id });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(
      kind === 'accept' ? copy.accepted : kind === 'cancel' ? copy.cancelled : copy.completed,
    );
    await load();
  }

  const property = row ? getContractProperty(row) : null;
  const canAccept = row?.status === 'pending_acceptance' && (row.client_id === userId || isAdmin);
  const canCancel =
    row != null &&
    ['draft', 'pending_acceptance', 'active'].includes(row.status) &&
    (isAdmin || [row.client_id, row.partner_id, row.agent_id].includes(userId));
  const canComplete =
    row?.status === 'active' && (isAdmin || [row.partner_id, row.agent_id].includes(userId));

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-6">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{row?.title ?? copy.detailTitle}</Heading>
            {row ? (
              <>
                <p className="font-mono text-sm text-slate-500">{row.code}</p>
                <p className="text-lg font-semibold text-brand-800">
                  {formatAoa(row.amount_aoa, row.purpose)}
                </p>
              </>
            ) : null}
          </div>
          {row ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(row.status)}>
                {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
              </Badge>
              {row.is_demo ? <Badge variant="default">Demo</Badge> : null}
            </div>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? <ForbiddenPanel message={copy.forbidden} /> : null}

        {canManage ? (
          <SoftListSlot pending={loading && !row}>
            {!row ? (
              <EmptyState
                title="Contrato não encontrado"
                description={error ?? copy.loadError}
                action={
                  <Link
                    href="/app/contratos"
                    className={cn(buttonVariants({ variant: 'primary' }))}
                  >
                    Ver contratos
                  </Link>
                }
              />
            ) : null}

            {row ? (
              <>
                {message ? (
                  <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div
                    role="alert"
                    className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                  >
                    {error}
                  </div>
                ) : null}

                <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-kuteka border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-semibold text-slate-800">{copy.fields.property}</h2>
                    <p className="mt-2 text-lg font-medium text-slate-900">
                      {property?.title ?? row.property_id}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {property?.code ?? row.property_id}
                    </p>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.fields.purpose}
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.fields.payment}
                        </dt>
                        <dd className="mt-1 text-slate-900">{copy.paymentsSoon}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.fields.createdAt}
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {new Date(row.created_at).toLocaleString('pt-PT')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.fields.updatedAt}
                        </dt>
                        <dd className="mt-1 text-slate-900">
                          {new Date(row.updated_at).toLocaleString('pt-PT')}
                        </dd>
                      </div>
                    </dl>
                    {row.terms_notes ? (
                      <div className="mt-5">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.fields.terms}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {row.terms_notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <aside className="rounded-kuteka border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-semibold text-slate-800">{copy.fields.parties}</h2>
                    <PartySnapshots
                      clientId={row.client_id}
                      partnerId={row.partner_id}
                      agentId={row.agent_id}
                      labels={{
                        client: copy.fields.client,
                        partner: copy.fields.partner,
                        agent: copy.fields.agent,
                      }}
                    />
                  </aside>
                </section>

                <div className="kuteka-glass flex flex-wrap gap-3 p-4">
                  {canAccept ? (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy != null}
                      onClick={() => void runTransition('accept')}
                    >
                      {busy === 'accept' ? copy.accepting : copy.accept}
                    </Button>
                  ) : null}
                  {canComplete ? (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy != null}
                      onClick={() => void runTransition('complete')}
                    >
                      {busy === 'complete' ? copy.completing : copy.complete}
                    </Button>
                  ) : null}
                  {canCancel ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy != null}
                      onClick={() => void runTransition('cancel')}
                    >
                      {busy === 'cancel' ? copy.cancelling : copy.cancel}
                    </Button>
                  ) : null}
                  <Link href="/app" className={cn(buttonVariants({ variant: 'secondary' }))}>
                    {copy.preparePayment}
                  </Link>
                </div>

                <FlowNextSteps
                  title="Seguinte: Pagamentos"
                  steps={[
                    { href: '/app', label: 'Preparar pagamento', primary: true },
                    { href: '/app/confianca', label: 'Confiança' },
                    { href: '/app/admin', label: 'Administração' },
                  ]}
                />
                <p className="text-xs text-slate-500">{copy.paymentsSoon}</p>
              </>
            ) : null}

            {!row && !loading ? (
              <FlowNextSteps
                steps={[
                  { href: '/app/contratos', label: 'Ver contratos', primary: true },
                  { href: '/app/confianca', label: 'Confiança' },
                ]}
              />
            ) : null}
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
