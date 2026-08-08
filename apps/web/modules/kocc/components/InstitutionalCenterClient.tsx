'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button } from '@kuteka/ui';
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
  listDirectory,
  promoteUser,
  type InstitutionalDirectoryRow,
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

export function InstitutionalCenterClient({ canManage }: PanelProps) {
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [bootstrapOpen, setBootstrapOpen] = useState(false);
  const [directory, setDirectory] = useState<InstitutionalDirectoryRow[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PromoteTargetRole>('administrator');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [bootRes, dirRes] = await Promise.all([bootstrapStatus(), listDirectory()]);
    if (bootRes.ok) setBootstrapOpen(bootRes.data.bootstrapOpen);
    else setError(bootRes.message);
    if (dirRes.ok) {
      setDirectory(dirRes.data);
      if (!userId && dirRes.data[0]) setUserId(dirRes.data[0].user_id);
    } else {
      setError(dirRes.message);
    }
    setLoading(false);
  }, [setError, userId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const promotable = useMemo(
    () => directory.filter((row) => !row.is_system_demo && !isDemoEmail(row.email)),
    [directory],
  );

  async function onClaimBootstrap() {
    if (!canManage) return;
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
    if (!canManage) return;
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
    setMessage('Papel institucional actualizado.');
    setReason('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {bootstrapOpen ? (
        <PanelSection title="Bootstrap Founder / Owner">
          <p className="text-sm text-slate-700">
            Ainda não existe Owner na plataforma. O primeiro utilizador autenticado (não demo) pode
            reivindicar o papel Founder / Owner. Este mecanismo fecha permanentemente após o claim.
          </p>
          <Button
            type="button"
            className="mt-3"
            disabled={!canManage || busy === 'bootstrap'}
            loading={busy === 'bootstrap'}
            onClick={() => void onClaimBootstrap()}
          >
            Reivindicar Founder / Owner
          </Button>
        </PanelSection>
      ) : null}

      <PanelSection title="Directório institucional">
        <SoftListSlot pending={loading}>
          {directory.length === 0 ? (
            <p className="text-sm text-slate-600">Sem entradas institucionais.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2 font-semibold">Email</th>
                    <th className="px-2 py-2 font-semibold">Nome</th>
                    <th className="px-2 py-2 font-semibold">Papéis</th>
                    <th className="px-2 py-2 font-semibold">Badges</th>
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
                        <td className="px-2 py-2 font-medium text-slate-900">{row.email ?? '—'}</td>
                        <td className="px-2 py-2 text-slate-700">{row.display_name ?? '—'}</td>
                        <td className="px-2 py-2 text-slate-700">
                          {row.roles.length ? row.roles.join(', ') : '—'}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SoftListSlot>
      </PanelSection>

      <PanelSection title="Promover utilizador">
        <p className="mb-3 text-sm text-slate-600">
          Contas <code className="text-xs">demo.*</code> não podem ser promovidas. Motivo
          obrigatório (auditoria).
        </p>
        <form className="flex flex-col gap-3 sm:max-w-lg" onSubmit={(e) => void onPromote(e)}>
          <label className="text-sm font-medium text-slate-800">
            Utilizador
            <select
              className={`${selectClass} mt-1`}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!canManage || !!busy || promotable.length === 0}
            >
              {promotable.map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {row.email ?? row.display_name ?? row.user_id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-800">
            Papel
            <select
              className={`${selectClass} mt-1`}
              value={role}
              onChange={(e) => setRole(e.target.value as PromoteTargetRole)}
              disabled={!canManage || !!busy}
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
              disabled={!canManage || !!busy}
              rows={3}
              placeholder="Ex.: Nomeação institucional após validação interna…"
            />
          </label>
          <Button
            type="submit"
            disabled={!canManage || busy === 'promote' || !userId || reason.trim().length < 3}
            loading={busy === 'promote'}
          >
            Promover
          </Button>
        </form>
        {!canManage ? (
          <p className="mt-2 text-sm text-amber-800">Apenas Founder/Owner com finance.manage.</p>
        ) : null}
      </PanelSection>
    </div>
  );
}
