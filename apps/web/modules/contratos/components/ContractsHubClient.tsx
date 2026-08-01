'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getContratosCopy } from '../content/pt';
import { getContractProperty, listContracts, type ContractRow } from '../services/contracts-client';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'brand' {
  if (status === 'active' || status === 'completed') return 'success';
  if (status === 'pending_acceptance' || status === 'draft') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'default';
}

export function ContractsHubClient() {
  const copy = getContratosCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage =
    sessionStatus === 'ready' && !!session?.permissions.includes('contracts.manage');
  const canCreate =
    sessionStatus === 'ready' &&
    (!!session?.permissions.includes('properties.manage') ||
      !!session?.permissions.includes('admin.panel'));
  const canAdmin = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canManage;

  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canManage) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listContracts();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [canManage, sessionStatus]);

  const stats = useMemo(() => {
    return {
      active: rows.filter((row) => row.status === 'active').length,
      pending: rows.filter((row) => row.status === 'pending_acceptance').length,
      completed: rows.filter((row) => row.status === 'completed').length,
      demo: rows.filter((row) => row.is_demo).length,
    };
  }, [rows]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.title}</Heading>
            <Text className="text-slate-600">{copy.subtitle}</Text>
          </div>
          {canCreate ? (
            <Link
              href="/app/contratos/novo"
              className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
            >
              {copy.create}
            </Link>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.forbidden}
            primaryHref="/auth/onboarding/papeis"
            primaryLabel="Activar papel"
            steps={[
              { href: '/app', label: 'Painel', primary: true },
              { href: '/app/confianca', label: 'Confiança' },
              { href: '/contacto', label: 'Contactar Kuteka' },
            ]}
          />
        ) : null}

        {canManage ? (
          <SoftListSlot pending={loading && rows.length === 0}>
            <p className="text-sm text-slate-500">{copy.demoNote}</p>

            <section
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="Resumo Contratos"
            >
              {(
                [
                  ['Activo', stats.active],
                  ['Pendente', stats.pending],
                  ['Concluído', stats.completed],
                  ['Demo', stats.demo],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-kuteka border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            {error ? (
              <div
                role="alert"
                className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {error}
              </div>
            ) : null}

            <section className="flex flex-col gap-3" aria-labelledby="contracts-heading">
              <div className="flex flex-col gap-1">
                <h2 id="contracts-heading" className="text-sm font-semibold text-slate-800">
                  Contratos recentes
                </h2>
                <Text className="text-sm text-slate-500">
                  Minutas e contratos activos entre Cliente, Parceiro e Agente.
                </Text>
              </div>
              {!loading && !error && rows.length === 0 ? (
                <EmptyState
                  title={copy.emptyTitle}
                  description={`${copy.empty} ${copy.emptyDemo}`}
                  action={
                    canCreate ? (
                      <Link
                        href="/app/contratos/novo"
                        className={cn(buttonVariants({ variant: 'primary' }))}
                      >
                        {copy.create}
                      </Link>
                    ) : null
                  }
                />
              ) : null}
              {rows.length > 0 ? (
                <ul className="grid gap-4 lg:grid-cols-2">
                  {rows.map((row) => {
                    const property = getContractProperty(row);
                    return (
                      <li
                        key={row.id}
                        className="rounded-kuteka border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-xs text-slate-500">{row.code}</p>
                              {row.is_demo ? <Badge variant="default">Demo</Badge> : null}
                            </div>
                            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                              {row.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {property?.title ?? row.property_id}
                            </p>
                            <p className="mt-2 font-semibold text-brand-800">
                              {formatAoa(row.amount_aoa, row.purpose)}
                            </p>
                          </div>
                          <Badge variant={statusVariant(row.status)} className="w-fit shrink-0">
                            {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                          </Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/app/contratos/detalhe?id=${encodeURIComponent(row.id)}`}
                            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                          >
                            {copy.openDetail}
                          </Link>
                          {property ? (
                            <Link
                              href={`/app/habitacao/detalhe?id=${encodeURIComponent(property.id)}`}
                              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                            >
                              Ver património
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>

            <FlowNextSteps
              title="Depois do contrato"
              steps={[
                { href: '/app', label: 'Preparar pagamento', primary: true },
                { href: '/app/confianca', label: 'Rever Confiança' },
                ...(canAdmin ? [{ href: '/app/admin', label: 'Administração' }] : []),
              ]}
            />
            <p className="text-xs text-slate-500">{copy.paymentsSoon}</p>
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
