'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { AuditCenterPanel } from '@/modules/administracao/components/AuditCenterPanel';
import { EscalationPanel } from '@/modules/administracao/components/EscalationPanel';
import { FeatureFlagsPanel } from '@/modules/finance/components/super/FeatureFlagsPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { RoleMissionPanel } from '@/modules/shell/components/RoleMissionPanel';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import { FounderOnboardingClient } from './FounderOnboardingClient';
import { InstitutionalCenterClient } from './InstitutionalCenterClient';
import { KoccCenterClient } from './KoccCenterClient';
import {
  bootstrapStatus,
  getIdentity,
  type FounderBootstrapStatus,
  type InstitutionalIdentity,
} from '../services/institutional-client';

type TabKey =
  | 'empresa'
  | 'pessoas'
  | 'operacao'
  | 'financeiro'
  | 'seguranca'
  | 'kocc'
  | 'auditoria'
  | 'flags'
  | 'escalacoes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'pessoas', label: 'Pessoas' },
  { key: 'operacao', label: 'Operação' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'seguranca', label: 'Segurança' },
  { key: 'kocc', label: 'KOCC' },
  { key: 'auditoria', label: 'Auditoria' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'escalacoes', label: 'Escalações' },
];

function initialTab(): TabKey {
  try {
    const raw = new URLSearchParams(window.location.search).get('tab');
    if (raw && TABS.some((t) => t.key === raw)) return raw as TabKey;
  } catch {
    /* ignore */
  }
  return 'empresa';
}

/**
 * Founder Center — experiência própria do Founder/Owner.
 * Reutiliza Gestão Institucional, Flags, KOCC e auditoria sem redesenhar o Super.
 */
export function FounderCenterClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { mode } = useRoleExperience();
  const [loading, setLoading] = useState(true);
  const [boot, setBoot] = useState<FounderBootstrapStatus | null>(null);
  const [identity, setIdentity] = useState<InstitutionalIdentity | null>(null);
  const [tab, setTab] = useState<TabKey>('empresa');

  const reload = useCallback(async () => {
    setLoading(true);
    const [b, i] = await Promise.all([bootstrapStatus(), getIdentity()]);
    if (b.ok) setBoot(b.data);
    if (i.ok) setIdentity(i.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'ready') void reload();
  }, [sessionStatus, reload]);

  useEffect(() => {
    setTab(initialTab());
  }, []);

  const isFounder = Boolean(identity?.isFounder || identity?.isOwner);
  const roles = identity?.roles ?? session?.roles ?? [];
  const hasFounderRole = roles.includes('founder') || roles.includes('co_founder');
  const showCenter = isFounder || hasFounderRole;
  const canManage =
    !!session?.permissions.includes('finance.manage') ||
    !!session?.permissions.includes('founder.manage') ||
    isFounder;

  // Bootstrap still open and not yet founder → onboarding only
  if (!loading && boot?.bootstrapOpen && !showCenter) {
    return <FounderOnboardingClient />;
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Founder / Owner</p>
          <Heading level={1}>Founder Center</Heading>
          <Text className="mt-2 text-slate-700">
            Missão: governação institucional. Hoje: pessoas, flags, KOCC, métricas e escalações.
            Escalone problemas apenas no topo da hierarquia — ou resolva via Super / Admin.
          </Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/super"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
            >
              Centro de Comando Super
            </Link>
            <Link
              href="/app/admin"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
            >
              Central de Trabalho
            </Link>
            <Link
              href="/app/centro-seguranca"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
            >
              Centro de Segurança
            </Link>
          </div>
        </header>

        <RoleMissionPanel mode={mode} />

        <SoftListSlot pending={loading}>
          {!showCenter ? (
            <FounderOnboardingClient />
          ) : (
            <>
              <nav className="flex flex-wrap gap-2" aria-label="Secções do Founder Center">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', t.key);
                        window.history.replaceState({}, '', url.toString());
                      } catch {
                        /* ignore */
                      }
                    }}
                    className={cn(
                      'rounded-kuteka border px-3 py-1.5 text-sm font-medium transition',
                      tab === t.key
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {tab === 'empresa' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Empresa · identidade</h2>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                      <dd className="font-medium text-slate-900">{session?.email ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">user_id</dt>
                      <dd className="break-all font-mono text-xs text-slate-800">
                        {identity?.userId ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Papéis</dt>
                      <dd className="text-slate-800">{roles.join(', ') || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Owner</dt>
                      <dd className="text-slate-800">{identity?.isOwner ? 'Sim' : 'Não'}</dd>
                    </div>
                  </dl>
                  <p className="text-sm text-slate-600">
                    Fluxo: Empresa → Pessoas → Operação → Financeiro → Segurança → KOCC → Auditoria.
                    Financeiro profundo continua no Super (sem redesenho nesta sprint).
                  </p>
                </section>
              ) : null}

              {tab === 'pessoas' ? <InstitutionalCenterClient canManage={canManage} /> : null}

              {tab === 'operacao' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Operação</h2>
                  <p className="text-sm text-slate-700">
                    Acompanhe a Central de Trabalho e a fila de publicação. Escalações críticas
                    chegam aqui e ao Super.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/app/admin"
                      className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
                    >
                      Abrir Central de Trabalho
                    </Link>
                    <Link
                      href="/app/admin/utilizadores"
                      className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
                    >
                      Utilizadores / Agentes
                    </Link>
                    <Link
                      href="/app/confianca/revisao"
                      className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
                    >
                      Revisão de Confiança
                    </Link>
                  </div>
                </section>
              ) : null}

              {tab === 'financeiro' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Financeiro (superfície)</h2>
                  <p className="text-sm text-slate-700">
                    Métricas e motor financeiro profundo ficam no Super Command Center — sem
                    redesenhar nesta sprint (backlog v1.1+).
                  </p>
                  <Link
                    href="/app/super"
                    className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
                  >
                    Abrir Super · Receitas e Pay
                  </Link>
                </section>
              ) : null}

              {tab === 'seguranca' ? (
                <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Segurança</h2>
                  <p className="text-sm text-slate-700">
                    Alterar email, telefone e sessões sem perder o user_id institucional.
                  </p>
                  <Link
                    href="/app/centro-seguranca"
                    className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
                  >
                    Abrir Centro de Segurança
                  </Link>
                </section>
              ) : null}

              {tab === 'kocc' ? <KoccCenterClient canManage={canManage} /> : null}
              {tab === 'auditoria' ? <AuditCenterPanel /> : null}
              {tab === 'flags' ? <FeatureFlagsPanel canManage={canManage} /> : null}
              {tab === 'escalacoes' ? <EscalationPanel /> : null}
            </>
          )}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
