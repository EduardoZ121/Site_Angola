'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Label } from '@kuteka/ui';
import { listAuditLogs, type AuditLogRow } from '@/modules/administracao/services/governance-client';
import {
  getIdentity,
  listDirectory,
  listOperationalTaskTerms,
  promoteUser,
  revokeOperationalTask,
  setOperationalTaskEnd,
  type InstitutionalDirectoryRow,
  type PromoteTargetRole,
} from '../services/institutional-client';

const TASKS: { role: PromoteTargetRole; title: string; detail: string }[] = [
  {
    role: 'administrator',
    title: 'Aprovar prestadores, publicação e pessoas',
    detail: 'Não muda o Owner, as flags nem o dinheiro.',
  },
  {
    role: 'super_administrator',
    title: 'Centro de comando e fila crítica',
    detail: 'Continua o Super Admin. Não liga pagamento real.',
  },
  {
    role: 'supervisor',
    title: 'Operação do dia e escalações',
    detail: 'Acompanha a carteira visível e escala. Não decide no lugar do Admin.',
  },
  {
    role: 'accountant',
    title: 'Preparar o fecho',
    detail: 'Lê o financeiro e anexa documentos. Não paga impostos nem mexe em dinheiro.',
  },
];

function personLabel(row: InstitutionalDirectoryRow): string {
  return row.display_name || row.email || row.user_id.slice(0, 8);
}

/**
 * O Owner passa tarefas que os papéis operacionais já sabem fazer.
 * Não cria Board, CEO nem sucessão automática.
 */
export function OwnerDelegationPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [rows, setRows] = useState<InstitutionalDirectoryRow[]>([]);
  const [directory, setDirectory] = useState<InstitutionalDirectoryRow[]>([]);
  const [canPass, setCanPass] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PromoteTargetRole>('administrator');
  const [reason, setReason] = useState('A operação não pode parar se o Owner não estiver.');
  const [endsOn, setEndsOn] = useState('');
  const [terms, setTerms] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditLogRow[] | null>(null);
  const [auditNote, setAuditNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [directory, identity, taskTerms] = await Promise.all([
        listDirectory(),
        getIdentity(),
        listOperationalTaskTerms(),
      ]);
      if (cancelled) return;
      if (directory.ok) {
        setDirectory(directory.data.filter((row) => !row.is_system_demo));
        const people = directory.data.filter((row) => !row.is_system_demo && !row.is_owner);
        setRows(people);
        setUserId(people[0]?.user_id ?? '');
      }
      if (identity.ok) setCanPass(!readOnly && Boolean(identity.data.isOwner || identity.data.isFounder));
      if (taskTerms.ok) {
        const next: Record<string, string> = {};
        for (const term of taskTerms.data) next[`${term.userId}:${term.role}`] = term.endsOn;
        setTerms(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPass || !userId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await promoteUser({ userId, role, reason });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const task = TASKS.find((item) => item.role === role);
    if (endsOn) {
      const dated = await setOperationalTaskEnd({ userId, role, endsOn, reason });
      if (!dated.ok) {
        setError(dated.message);
        setMessage(task ? `Tarefa passada: ${task.title}. A data de fim não ficou gravada.` : 'Tarefa passada. A data de fim não ficou gravada.');
        return;
      }
      setTerms((prev) => ({ ...prev, [`${userId}:${role}`]: endsOn }));
    }
    setMessage(task ? `Tarefa passada: ${task.title}.` : 'Tarefa passada.');
    const directory = await listDirectory();
    if (directory.ok) setDirectory(directory.data.filter((row) => !row.is_system_demo));
  }

  async function onRevoke(userIdToRevoke: string, target: PromoteTargetRole) {
    if (!canPass || reason.trim().length < 3) {
      setError('Escreve o motivo da retirada, com pelo menos 3 caracteres.');
      return;
    }
    setRevoking(`${userIdToRevoke}:${target}`);
    setError(null);
    setMessage(null);
    const result = await revokeOperationalTask({
      userId: userIdToRevoke,
      role: target,
      reason,
    });
    setRevoking(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDirectory((prev) =>
      prev.map((row) =>
        row.user_id === userIdToRevoke
          ? { ...row, roles: row.roles.filter((code) => code !== target) }
          : row,
      ),
    );
    setMessage('Tarefa retirada. O rasto de quem a fez fica.');
  }

  async function onOpen(key: string) {
    setOpenKey((current) => (current === key ? null : key));
    if (audit) return;
    const result = await listAuditLogs(80, 'institutional.');
    if (!result.ok) {
      setAudit([]);
      setAuditNote('O rasto não está visível nesta conta.');
      return;
    }
    setAudit(result.data);
    setAuditNote(null);
  }

  return (
    <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-slate-900">A Kuteka não depende do Owner</h2>
      <p className="text-sm text-slate-700">
        O Owner passa uma tarefa a uma pessoa que já tem conta. Essa pessoa continua o trabalho. O Owner não deixa de o ser, e ninguém entra na conta dele.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {TASKS.map((task) => (
          <li key={task.role} className="rounded-kuteka border border-slate-200 bg-white px-3 py-2">
            <p className="text-sm font-medium text-slate-900">{task.title}</p>
            <p className="mt-1 text-xs text-slate-600">{task.detail}</p>
          </li>
        ))}
      </ul>
      {canPass ? (
        <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
          <div>
            <Label htmlFor="delegate-person">Pessoa</Label>
            <select
              id="delegate-person"
              className="mt-1 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            >
              {rows.map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {personLabel(row)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="delegate-task">Tarefa</Label>
            <select
              id="delegate-task"
              className="mt-1 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              value={role}
              onChange={(event) => setRole(event.target.value as PromoteTargetRole)}
            >
              {TASKS.map((task) => (
                <option key={task.role} value={task.role}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="delegate-end">Fim</Label>
            <input
              id="delegate-end"
              type="date"
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className="mt-1 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-600">Opcional. Chegado o dia, a tarefa não sai sozinha. O Owner retira.</p>
          </div>
          <div>
            <Label htmlFor="delegate-reason">Motivo</Label>
            <textarea
              id="delegate-reason"
              required
              minLength={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 min-h-16 w-full rounded-kuteka border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error ? <p className="text-sm text-rose-800">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
          <Button type="submit" loading={busy} disabled={!userId}>
            Passar esta tarefa
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          {readOnly
            ? 'Só leitura. Passar ou retirar a tarefa faz-se no Founder Center.'
            : 'Só o Owner ou um Founder passa a tarefa. Quem a recebe já a pode executar sem voltar a pedir ao Owner.'}
        </p>
      )}
      <div className="overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-900">Relatório de responsabilidades</h3>
        <p className="mt-1 text-xs text-slate-600">
          Quem já tem o cargo. O fim, quando existe, está gravado. A tarefa não desaparece nesse dia. Financeiro, Kuteka Pay e jurídico não estão nesta lista.
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="py-1 pr-3 font-medium">Responsabilidade</th>
              <th className="py-1 pr-3 font-medium">Pessoa</th>
              <th className="py-1 pr-3 font-medium">Fim</th>
              <th className="py-1 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => {
              const holders = directory.filter((row) => row.roles.includes(task.role));
              return (
                <tr key={task.role} className="border-t border-slate-200">
                  <td className="py-2 pr-3">{task.title}</td>
                  <td className="py-2 pr-3">
                    {holders.length ? (
                      <ul className="flex flex-col gap-1">
                        {holders.map((holder) => (
                          <li key={holder.user_id} className="flex flex-col gap-1">
                            <span className="flex flex-wrap items-center gap-2">
                            <span>{personLabel(holder)}</span>
                            <button
                              type="button"
                              className="text-xs font-semibold text-slate-700 underline"
                              onClick={() => void onOpen(`${holder.user_id}:${task.role}`)}
                            >
                              {openKey === `${holder.user_id}:${task.role}` ? 'Fechar' : 'Abrir'}
                            </button>
                            {canPass ? (
                              <button
                                type="button"
                                className="text-xs font-semibold text-slate-700 underline"
                                disabled={revoking === `${holder.user_id}:${task.role}`}
                                onClick={() => void onRevoke(holder.user_id, task.role)}
                              >
                                {revoking === `${holder.user_id}:${task.role}` ? 'A retirar…' : 'Retirar'}
                              </button>
                            ) : null}
                            </span>
                            {openKey === `${holder.user_id}:${task.role}` ? (
                              <span className="text-xs text-slate-600">
                                {task.detail}
                                {auditNote ? ` ${auditNote}` : null}
                                {audit
                                  ? audit
                                      .filter((row) => {
                                        if (row.entity_id !== holder.user_id) return false;
                                        const meta =
                                          row.metadata && typeof row.metadata === 'object'
                                            ? (row.metadata as Record<string, unknown>)
                                            : {};
                                        const target = typeof meta.targetRole === 'string' ? meta.targetRole : '';
                                        return target === '' || target === task.role;
                                      })
                                      .slice(0, 3)
                                      .map((row) => ` ${row.action}${row.reason ? `: ${row.reason}` : ''}.`)
                                      .join('') || (auditNote ? '' : ' Sem rasto desta tarefa.')
                                  : ' A ler o rasto…'}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {holders.length ? (
                      <ul className="flex flex-col gap-1">
                        {holders.map((holder) => {
                          const key = `${holder.user_id}:${task.role}`;
                          const end = terms[key];
                          const overdue = end != null && end < new Date().toISOString().slice(0, 10);
                          return (
                            <li key={key}>
                              {end ? end : 'Sem fim'}
                              {overdue ? ' · fim ultrapassado' : ''}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2">{holders.length ? 'Activa' : 'Não passada'}</td>
                </tr>
              );
            })}
            <tr className="border-t border-slate-200">
              <td className="py-2 pr-3">Financeiro, Pay e jurídico</td>
              <td className="py-2 pr-3">—</td>
              <td className="py-2 pr-3">—</td>
              <td className="py-2">Não delegada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
