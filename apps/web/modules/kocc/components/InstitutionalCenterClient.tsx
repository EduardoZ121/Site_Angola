'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import {
  Feedback,
  PanelSection,
  selectClass,
  textareaClass,
  useFeedback,
} from '@/modules/finance/components/super/shared';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { institutionalBadge } from '@/modules/shell/lib/institutional-badge';
import {
  bootstrapStatus,
  claimBootstrap,
  getIdentity,
  listDirectory,
  promoteUser,
  type InstitutionalDirectoryRow,
  type InstitutionalIdentity,
  type PromoteTargetRole,
} from '../services/institutional-client';

type PanelProps = {
  canManage: boolean;
};

const PROMOTE_ROLES: { value: PromoteTargetRole; label: string }[] = [
  { value: 'founder', label: 'Founder' },
  { value: 'co_founder', label: 'Co-Founder' },
  { value: 'super_administrator', label: 'Super Administrator' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

function isDemoEmail(email: string | null): boolean {
  return !!email && /^demo\./i.test(email.split('@')[0] ?? '');
}

function roleLabel(row: InstitutionalDirectoryRow): string {
  if (row.is_owner) return 'Founder / Owner';
  if (row.is_founder && row.roles.includes('co_founder')) return 'Co-Founder';
  if (row.is_founder) return 'Founder';
  if (row.roles.includes('super_administrator')) return 'Super Admin';
  if (row.roles.includes('administrator')) return 'Admin';
  if (row.roles.includes('supervisor')) return 'Supervisor';
  if (row.roles.includes('auditor')) return 'Auditor';
  return row.roles[0] ?? '—';
}

export function InstitutionalCenterClient({ canManage }: PanelProps) {
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [bootstrapOpen, setBootstrapOpen] = useState(false);
  const [directory, setDirectory] = useState<InstitutionalDirectoryRow[]>([]);
  const [identity, setIdentity] = useState<InstitutionalIdentity | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PromoteTargetRole>('co_founder');
  const [reason, setReason] = useState('');
  const [manageId, setManageId] = useState<string | null>(null);

  const isFounderActor = Boolean(identity?.isFounder || identity?.isOwner);
  const canBootstrap = bootstrapOpen && !identity?.isSystemDemo;
  const canPromote = canManage || isFounderActor;

  const load = useCallback(async () => {
    setLoading(true);
    const [bootRes, dirRes, idRes] = await Promise.all([
      bootstrapStatus(),
      listDirectory(),
      getIdentity(),
    ]);
    if (bootRes.ok) setBootstrapOpen(bootRes.data.bootstrapOpen);
    else setError(bootRes.message);
    if (dirRes.ok) {
      setDirectory(dirRes.data);
      setUserId((prev) => prev || dirRes.data[0]?.user_id || '');
    } else {
      /* directory may fail before Founder claim — soft */
    }
    if (idRes.ok) setIdentity(idRes.data);
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const promotable = useMemo(
    () => directory.filter((row) => !row.is_system_demo && !isDemoEmail(row.email)),
    [directory],
  );

  const manageRow = manageId ? directory.find((r) => r.user_id === manageId) : null;

  async function onClaimBootstrap() {
    setBusy('bootstrap');
    setMessage(null);
    const result = await claimBootstrap();
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage('Founder / Owner reivindicado. Bootstrap bloqueado permanentemente.');
    setBootstrapOpen(false);
    await load();
  }

  async function onPromote(event: FormEvent) {
    event.preventDefault();
    if (!canPromote) return;
    const selected = directory.find((r) => r.user_id === userId);
    if (selected && (selected.is_system_demo || isDemoEmail(selected.email))) {
      setError('Contas demo.* não podem ser promovidas.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Indique um motivo (mín. 3 caracteres).');
      return;
    }
    setBusy('promote');
    setMessage(null);
    const result = await promoteUser({ userId, role, reason: reason.trim() });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage('Papel institucional actualizado — registado no Audit Center.');
    setReason('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      <PanelSection title="Como entrar como Founder">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Crie a conta real (Auth) → confirme o <code className="text-xs">user_id</code> em{' '}
            <Link href="/app/fundador" className="font-semibold underline">
              /app/fundador
            </Link>
            .
          </li>
          <li>
            Se o bootstrap estiver aberto, reivindique Founder/Owner (liga{' '}
            <code className="text-xs">user_id → founders</code>).
          </li>
          <li>
            Depois do login, mude a experiência para Superadministrador → este separador para gerir
            Co-Founder / Admin / Supervisor.
          </li>
          <li>
            Email muda em{' '}
            <Link href="/app/centro-seguranca" className="font-semibold underline">
              Centro de Segurança
            </Link>{' '}
            — a identidade permanente continua a ser o user_id.
          </li>
        </ol>
        {identity?.userId ? (
          <p className="mt-3 text-xs text-slate-600">
            O seu user_id: <code className="font-mono">{identity.userId}</code>
          </p>
        ) : null}
        <Link
          href="/app/fundador"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 w-fit')}
        >
          Abrir guia Founder (/app/fundador)
        </Link>
      </PanelSection>

      {bootstrapOpen ? (
        <PanelSection title="Bootstrap Founder / Owner">
          <p className="text-sm text-slate-700">
            Ainda não existe Owner. Qualquer utilizador autenticado (não demo) pode reivindicar —
            não precisa de finance.manage prévio. Após o claim o mecanismo fecha para sempre.
          </p>
          <Button
            type="button"
            className="mt-3"
            disabled={!canBootstrap || busy === 'bootstrap'}
            loading={busy === 'bootstrap'}
            onClick={() => void onClaimBootstrap()}
          >
            Assumir como Founder / Owner
          </Button>
          {!canBootstrap ? (
            <p className="mt-2 text-sm text-amber-800">
              Contas demo.* não podem assumir Founder. Use a conta real em /app/fundador.
            </p>
          ) : null}
        </PanelSection>
      ) : null}

      <PanelSection title="Directório institucional">
        <SoftListSlot pending={loading}>
          {directory.length === 0 ? (
            <p className="text-sm text-slate-600">
              Sem entradas (precisa de ser Founder ou finance.manage). Se acabou de fazer bootstrap,
              recarregue a sessão.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 font-semibold">Utilizador</th>
                    <th className="px-2 py-2 font-semibold">Papel</th>
                    <th className="px-2 py-2 font-semibold">Estado</th>
                    <th className="px-2 py-2 font-semibold">user_id</th>
                    <th className="px-2 py-2 font-semibold">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.map((row) => {
                    const badge = institutionalBadge({
                      isOwner: row.is_owner,
                      isFounder: row.is_founder,
                      isSystemDemo: row.is_system_demo,
                      roles: row.roles,
                    });
                    return (
                      <tr key={row.user_id} className="border-b border-slate-100 align-top">
                        <td className="px-2 py-2">
                          <p className="font-medium text-slate-900">{row.email ?? '—'}</p>
                          <p className="text-xs text-slate-500">{row.display_name ?? ''}</p>
                        </td>
                        <td className="px-2 py-2 text-slate-700">{roleLabel(row)}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="default">Activo</Badge>
                            {row.is_system_demo ? (
                              <Badge variant="default">system_demo</Badge>
                            ) : null}
                            {badge ? (
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-2 font-mono text-[10px] text-slate-600">
                          {row.user_id}
                        </td>
                        <td className="px-2 py-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!canPromote || row.is_system_demo}
                            onClick={() => {
                              setManageId(row.user_id);
                              setUserId(row.user_id);
                            }}
                          >
                            Gerir
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SoftListSlot>
      </PanelSection>

      {manageRow ? (
        <PanelSection title={`Gerir · ${manageRow.email ?? manageRow.user_id}`}>
          <p className="mb-2 text-sm text-slate-600">
            Promover / alterar papel com motivo (Audit Center). Remover/suspender papéis críticos
            deve ser feito com o mesmo fluxo de promoção controlada — nunca por SQL directo em
            produção.
          </p>
          <p className="mb-3 font-mono text-xs text-slate-500">{manageRow.user_id}</p>
          <form className="flex flex-col gap-3 sm:max-w-lg" onSubmit={(e) => void onPromote(e)}>
            <label className="text-sm font-medium text-slate-800">
              Novo papel
              <select
                className={`${selectClass} mt-1`}
                value={role}
                onChange={(e) => setRole(e.target.value as PromoteTargetRole)}
                disabled={!canPromote || !!busy}
              >
                {PROMOTE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-800">
              Motivo (obrigatório · auditoria)
              <textarea
                className={`${textareaClass} mt-1`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={!canPromote || !!busy}
                rows={3}
                placeholder="Ex.: Nomeação de Co-Founder após deliberação…"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={!canPromote || busy === 'promote' || reason.trim().length < 3}
                loading={busy === 'promote'}
              >
                Aplicar papel
              </Button>
              <Button type="button" variant="ghost" onClick={() => setManageId(null)}>
                Fechar
              </Button>
              <Link
                href="/app/centro-seguranca"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              >
                Alterar email (Centro de Segurança)
              </Link>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <PanelSection title="Adicionar Co-Founder / promover">
        <p className="mb-3 text-sm text-slate-600">
          O sócio cria a conta real → copia o <code className="text-xs">user_id</code> em
          /app/fundador → aqui cola o UUID, escolhe Co-Founder e indica motivo. Contas{' '}
          <code className="text-xs">demo.*</code> são rejeitadas.
        </p>
        <form className="flex flex-col gap-3 sm:max-w-lg" onSubmit={(e) => void onPromote(e)}>
          <label className="text-sm font-medium text-slate-800">
            Utilizador (directório)
            <select
              className={`${selectClass} mt-1`}
              value={promotable.some((r) => r.user_id === userId) ? userId : ''}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!canPromote || !!busy}
            >
              <option value="">— ou cole o user_id abaixo —</option>
              {promotable.map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {row.email ?? row.display_name ?? row.user_id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-800">
            user_id (UUID)
            <input
              className={`${selectClass} mt-1 font-mono text-xs`}
              value={userId}
              onChange={(e) => setUserId(e.target.value.trim())}
              disabled={!canPromote || !!busy}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </label>
          <label className="text-sm font-medium text-slate-800">
            Papel
            <select
              className={`${selectClass} mt-1`}
              value={role}
              onChange={(e) => setRole(e.target.value as PromoteTargetRole)}
              disabled={!canPromote || !!busy}
            >
              {PROMOTE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-800">
            Motivo
            <textarea
              className={`${textareaClass} mt-1`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!canPromote || !!busy}
              rows={3}
              placeholder="Ex.: Nomeação institucional após validação interna…"
            />
          </label>
          <Button
            type="submit"
            disabled={!canPromote || busy === 'promote' || !userId || reason.trim().length < 3}
            loading={busy === 'promote'}
          >
            Promover
          </Button>
        </form>
        {!canPromote ? (
          <p className="mt-2 text-sm text-amber-800">
            Apenas Founder/Owner (ou finance.manage) pode promover. Faça bootstrap em /app/fundador
            se ainda não existir Owner.
          </p>
        ) : null}
      </PanelSection>
    </div>
  );
}
