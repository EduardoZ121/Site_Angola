'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { resetInstitutionalIdentityCache } from '@/modules/shell/hooks/useInstitutionalIdentity';
import { institutionalBadge } from '@/modules/shell/lib/institutional-badge';
import {
  bootstrapStatus,
  claimBootstrap,
  getIdentity,
  type FounderBootstrapStatus,
  type InstitutionalIdentity,
} from '../services/institutional-client';

/**
 * Operational Founder bootstrap — reachable by any signed-in (non-demo) account.
 * Does NOT require finance.manage (chicken-egg fix for first Owner).
 */
export function FounderOnboardingClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [boot, setBoot] = useState<FounderBootstrapStatus | null>(null);
  const [identity, setIdentity] = useState<InstitutionalIdentity | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [b, i] = await Promise.all([bootstrapStatus(), getIdentity()]);
    if (b.ok) setBoot(b.data);
    else setError(b.message);
    if (i.ok) setIdentity(i.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'ready') void reload();
  }, [sessionStatus, reload]);

  async function onClaim() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await claimBootstrap();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    resetInstitutionalIdentityCache();
    setMessage(
      'Conta ligada como Founder / Owner. Recarregue a sessão (sair e entrar) se o menu Super ainda não aparecer.',
    );
    await reload();
  }

  const badge = institutionalBadge({
    isOwner: identity?.isOwner,
    isFounder: identity?.isFounder,
    isSystemDemo: identity?.isSystemDemo,
    roles: identity?.roles,
  });

  const isDemo =
    identity?.isSystemDemo ||
    (!!session?.email && /^demo\./i.test(session.email.split('@')[0] ?? ''));

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Governação institucional</p>
          <Heading level={1}>Founder / Owner</Heading>
          <Text className="mt-2 text-slate-700">
            A identidade permanente é o <strong>user_id</strong> (UUID). O email pode mudar no
            Centro de Segurança sem perder Founder, Owner, histórico ou permissões.
          </Text>
        </header>

        <SoftListSlot pending={loading}>
          {error ? (
            <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              {message}
            </div>
          ) : null}

          <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-slate-900">A sua conta actual</h2>
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
                <dd className="text-slate-800">
                  {(identity?.roles ?? session?.roles ?? []).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Badge</dt>
                <dd>
                  {badge ? (
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">
              Onde ver o user_id: nesta página, no Centro de Segurança, ou no menu da conta após o
              bootstrap (badge Founder / Owner).
            </p>
          </section>

          {boot?.bootstrapOpen ? (
            <section className="kuteka-detail-panel flex flex-col gap-3 border-blue-200 bg-blue-50/50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Passo 1 — Bootstrap do primeiro Founder
              </h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-800">
                <li>Crie a sua conta real pelo fluxo normal de autenticação (não use demo.*).</li>
                <li>Confirme o email / sessão acima.</li>
                <li>
                  Clique <strong>Assumir como Founder / Owner</strong> — o sistema grava o seu{' '}
                  <code className="text-xs">user_id</code> em{' '}
                  <code className="text-xs">founders</code> com{' '}
                  <code className="text-xs">is_founder</code> e{' '}
                  <code className="text-xs">is_owner</code>.
                </li>
                <li>O mecanismo fecha permanentemente. Não há segunda oportunidade automática.</li>
              </ol>
              {isDemo ? (
                <p className="text-sm text-rose-800">
                  Contas demo.* não podem ser Founder de produção. Use a sua conta real.
                </p>
              ) : (
                <Button
                  type="button"
                  disabled={busy || sessionStatus !== 'ready'}
                  loading={busy}
                  onClick={() => void onClaim()}
                >
                  Assumir como Founder / Owner
                </Button>
              )}
            </section>
          ) : (
            <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Bootstrap</h2>
              <p className="text-sm text-slate-700">
                O bootstrap do primeiro Owner já está <strong>fechado</strong>
                {boot?.completedAt
                  ? ` (concluído em ${new Date(boot.completedAt).toLocaleString('pt-PT')})`
                  : ''}
                . Novos Co-Founders e papéis criam-se em Gestão Institucional.
              </p>
            </section>
          )}

          {(identity?.isFounder || identity?.isOwner) && (
            <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Passo 2 — Founder Center</h2>
              <p className="text-sm text-slate-700">
                Após o claim, use o seletor de papel → <strong>Founder / Owner</strong>. A home e o
                menu abrem o Founder Center (não o cockpit de Cliente/Parceiro).
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                <li>
                  <Link href="/app/fundador?tab=pessoas" className="font-semibold underline">
                    Founder Center → Pessoas
                  </Link>{' '}
                  — Fundadores, Co-Founders, Super Admin, Admin, Supervisor
                </li>
                <li>Feature Flags, KOCC, auditoria e escalações no próprio Center</li>
                <li>
                  <Link href="/app/centro-seguranca" className="font-semibold underline">
                    Centro de Segurança → Alterar email
                  </Link>{' '}
                  (dupla confirmação; user_id permanece)
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/fundador"
                  className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
                >
                  Abrir Founder Center
                </Link>
                <Link
                  href="/app/centro-seguranca"
                  className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
                >
                  Alterar email com segurança
                </Link>
              </div>
            </section>
          )}

          <section className="kuteka-detail-panel flex flex-col gap-2 p-5 text-sm text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">Co-Founder</h2>
            <p>
              Com a conta Founder/Owner: Gestão Institucional → promover utilizador → papel{' '}
              <strong>Co-Founder</strong> + motivo obrigatório. O sócio deve já ter conta real
              (user_id). Contas demo.* são rejeitadas.
            </p>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
